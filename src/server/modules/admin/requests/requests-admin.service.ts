import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { listAuditLogsForSubject } from "@/server/modules/admin/audit/admin-audit.repository";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countRequestNotifications,
  countRequestsPerStatus,
  findRequestDetail,
  listRequestRows,
  listServiceFilterOptions,
  lockRequestLinkById,
  removeProviderLinkByAdmin,
} from "@/server/modules/admin/requests/requests-admin.repository";
import {
  REQUEST_STATUSES,
  type RequestStatus,
  type RequestsListQuery,
} from "@/server/modules/admin/requests/requests-admin.schemas";
import { NOTIFICATION_TYPES } from "@/server/modules/notifications/notification.types";
import {
  completeServiceRequest,
  findProviderUserIdByProfileId,
  lockServiceRequestByPublicId,
} from "@/server/modules/requests/request.repository";
import { cancelAdminServiceRequest, notifyUser } from "@/server/modules/requests/request.service";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "requests";
const SUBJECT = "service_request";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;
const money = (value: bigint | null | undefined) => (value === null || value === undefined ? null : Number(value));
const decimal = (value: { toString(): string }) => Number(value.toString());
const day = (value: Date) => value.toISOString().slice(0, 10);

// ===================================================================== list

export interface AdminRequestListItem {
  agreedPriceToman: number | null;
  category: string;
  consumer: { id: string; name: string; phone: string };
  createdAt: string;
  dates: string[];
  id: string;
  landAreaSquareMeters: number;
  landTitle: string;
  provider: { id: string | null; name: string } | null;
  providersInvited: number;
  serviceImage: string | null;
  serviceName: string;
  status: RequestStatus;
  updatedAt: string;
}

export interface AdminRequestList {
  counts: Record<"all" | RequestStatus, number>;
  items: AdminRequestListItem[];
  page: number;
  pageCount: number;
  perPage: number;
  serviceOptions: Array<{ id: string; name: string; services: Array<{ id: string; name: string }> }>;
  total: number;
}

export async function listAdminRequests(query: RequestsListQuery): Promise<AdminRequestList> {
  const now = systemClock.now();
  const [{ rows, total }, perStatus, categories] = await Promise.all([
    listRequestRows(query, now),
    countRequestsPerStatus(query, now),
    listServiceFilterOptions(),
  ]);

  const counts = Object.fromEntries(REQUEST_STATUSES.map((status) => [status, perStatus[status] ?? 0])) as Record<
    RequestStatus,
    number
  >;

  return {
    counts: { ...counts, all: Object.values(counts).reduce((sum, value) => sum + value, 0) },
    items: rows.map((row) => ({
      agreedPriceToman: money(row.agreedPriceToman),
      category: row.serviceCategoryNameSnapshot,
      consumer: {
        id: row.consumer.publicId,
        name: row.consumer.name ?? row.consumerNameSnapshot,
        phone: row.consumer.phone,
      },
      createdAt: row.createdAt.toISOString(),
      dates: row.serviceRequestDates.map((entry) => day(entry.scheduledDate)),
      id: row.publicId,
      landAreaSquareMeters: decimal(row.landAreaSquareMetersSnapshot),
      landTitle: row.landTitleSnapshot,
      provider: row.assignedProviderNameSnapshot
        ? { id: row.assignedProvider?.user.publicId ?? null, name: row.assignedProviderNameSnapshot }
        : null,
      providersInvited: row._count.serviceRequestProviders,
      serviceImage: row.service.image,
      serviceName: row.serviceNameSnapshot,
      status: row.status as RequestStatus,
      updatedAt: row.updatedAt.toISOString(),
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    serviceOptions: categories.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      services: category.services.map((service) => ({ id: service.id.toString(), name: service.name })),
    })),
    total,
  };
}

// =================================================================== detail

export interface AdminRequestActorInfo {
  name: string;
  type: "consumer" | "provider" | "admin" | "system";
}

function actorOf(row: {
  actorAdmin: { name: string } | null;
  actorType: string;
  actorUser: { name: string | null; phone: string } | null;
}): AdminRequestActorInfo {
  const type = row.actorType as AdminRequestActorInfo["type"];
  if (type === "admin") return { name: row.actorAdmin?.name ?? "مدیر حذف‌شده", type };
  if (type === "system") return { name: "سامانه", type };
  return { name: row.actorUser?.name ?? row.actorUser?.phone ?? "کاربر", type };
}

const AUDIT_LABELS: Record<string, string> = {
  "requests.cancel": "لغو درخواست",
  "requests.complete": "ثبت انجام کار",
  "requests.withdraw_provider": "برداشتن دعوت از خدمات‌دهنده",
};

export async function getAdminRequestDetail(publicId: string) {
  const row = await findRequestDetail(publicId);
  if (!row) return null;

  const [audits, notificationsCount] = await Promise.all([
    listAuditLogsForSubject(SUBJECT, row.id, 30),
    countRequestNotifications(row.id),
  ]);

  return {
    acceptedAt: iso(row.acceptedAt),
    agreedPriceToman: money(row.agreedPriceToman),
    audits: audits.map((log) => ({
      action: log.action,
      adminName: log.admin?.name ?? null,
      createdAt: log.createdAt.toISOString(),
      id: log.id.toString(),
      ipAddress: log.ipAddress,
      label: AUDIT_LABELS[log.action] ?? log.action,
      newValues: (log.newValues as Record<string, unknown> | null) ?? null,
      oldValues: (log.oldValues as Record<string, unknown> | null) ?? null,
    })),
    cancellation:
      row.status === "cancelled"
        ? {
            at: iso(row.cancelledAt),
            by: row.cancelledBy,
            byName:
              row.cancelledBy === "admin"
                ? (row.cancelledByAdmin?.name ?? "مدیر")
                : (row.cancelledByUser?.name ?? row.cancelledByUser?.phone ?? null),
            reason: row.cancelReason,
          }
        : null,
    candidates: row.serviceRequestCandidates.map((candidate) => ({
      distanceKm: decimal(candidate.distanceKm),
      foundAt: candidate.foundAt.toISOString(),
      id: candidate.id.toString(),
      priceToman: Number(candidate.servicePriceSnapshotToman),
      pricingUnit: candidate.pricingUnitSnapshot,
      providerId: candidate.providerProfile.user.publicId,
      providerName: candidate.providerNameSnapshot,
    })),
    category: row.serviceCategoryNameSnapshot,
    completedAt: iso(row.completedAt),
    consumer: {
      deleted: row.consumer.deletedAt !== null,
      id: row.consumer.publicId,
      image: row.consumer.image,
      name: row.consumer.name ?? row.consumerNameSnapshot,
      phone: row.consumer.phone,
    },
    consumerNote: row.consumerNote,
    createdAt: row.createdAt.toISOString(),
    dates: row.serviceRequestDates.map((entry) => day(entry.scheduledDate)),
    id: row.publicId,
    land: {
      areaSquareMeters: decimal(row.landAreaSquareMetersSnapshot),
      currentTitle: row.land.deletedAt ? null : row.land.title,
      latitude: decimal(row.landLatitudeSnapshot),
      longitude: decimal(row.landLongitudeSnapshot),
      title: row.landTitleSnapshot,
    },
    links: row.serviceRequestProviders.map((link) => ({
      distanceKm: decimal(link.distanceKm),
      history: link.serviceRequestProviderHistories.map((entry) => ({
        actor: actorOf(entry),
        createdAt: entry.createdAt.toISOString(),
        from: entry.fromStatus,
        id: entry.id.toString(),
        reason: entry.reason,
        to: entry.toStatus,
      })),
      id: link.id.toString(),
      priceToman: Number(link.servicePriceSnapshotToman),
      providerId: link.providerProfile.user.publicId,
      providerName: link.providerNameSnapshot,
      providerPhone: link.providerProfile.user.phone,
      rejectionReason: link.rejectionReason,
      removedReason: link.removedReason,
      respondedAt: iso(link.respondedAt),
      sentAt: link.sentAt.toISOString(),
      status: link.status,
      viewedAt: iso(link.viewedAt),
    })),
    notificationsCount,
    provider: row.assignedProviderNameSnapshot
      ? {
          id: row.assignedProvider?.user.publicId ?? null,
          image: row.assignedProvider?.user.image ?? null,
          name: row.assignedProviderNameSnapshot,
          phone: row.assignedProvider?.user.phone ?? null,
        }
      : null,
    searchId: row.searchPublicId,
    service: {
      currentName: row.service.name,
      id: row.service.id.toString(),
      image: row.service.image,
      isActive: row.service.isActive === 1,
      name: row.serviceNameSnapshot,
    },
    status: row.status as RequestStatus,
    timeline: row.serviceRequestStatusHistories.map((entry) => ({
      actor: actorOf(entry),
      createdAt: entry.createdAt.toISOString(),
      from: entry.fromStatus,
      id: entry.id.toString(),
      reason: entry.reason,
      to: entry.toStatus,
    })),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
}

export type AdminRequestDetail = NonNullable<Awaited<ReturnType<typeof getAdminRequestDetail>>>;

// ================================================================== actions

/** Cancels an open request for both sides; links still open are closed by the shared cancel flow. */
export async function cancelAdminRequest(
  actor: Actor,
  publicId: string,
  input: { expectedVersion: number; reason: string },
) {
  return cancelAdminServiceRequest(actor.adminId, publicId, {
    expectedVersion: input.expectedVersion,
    onCancelled: async (transaction, locked) => {
      await recordAdminAudit(
        {
          action: "requests.cancel",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { reason: input.reason, status: "cancelled" },
          oldValues: { status: locked.fromStatus },
          request: actor.request,
          subject: { id: locked.id, type: SUBJECT },
        },
        transaction,
      );
    },
    reason: input.reason,
  });
}

/**
 * Closes an in-progress job on the consumer's behalf, e.g. when the work was
 * done but the consumer never confirmed it in the app.
 */
export async function completeAdminRequest(
  actor: Actor,
  publicId: string,
  input: { expectedVersion: number; reason: string },
) {
  const now = systemClock.now();
  return runInTransaction(async (transaction) => {
    const locked = await lockServiceRequestByPublicId(transaction, publicId);
    if (!locked) throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست پیدا نشد.");
    if (locked.status !== "in_progress") {
      throw new ApiError(409, API_ERROR_CODES.conflict, "فقط درخواست در حال انجام را می‌توان انجام‌شده ثبت کرد.");
    }
    if (locked.version !== input.expectedVersion) {
      throw new ApiError(409, API_ERROR_CODES.conflict, "درخواست در این فاصله تغییر کرده است؛ صفحه را تازه کنید.");
    }

    const completed = await completeServiceRequest(transaction, {
      actorAdminId: actor.adminId,
      consumerUserId: locked.consumerUserId,
      expectedVersion: locked.version,
      now,
      reason: input.reason,
      requestId: locked.id,
    });
    if (!completed.ok) throw new ApiError(409, API_ERROR_CODES.conflict, "ثبت انجام کار ممکن نشد.");

    const recipients: Array<{ userId: bigint; viewer: "consumer" | "provider" }> = [
      { userId: locked.consumerUserId, viewer: "consumer" },
    ];
    if (locked.assignedProviderProfileId) {
      const provider = await findProviderUserIdByProfileId(locked.assignedProviderProfileId);
      if (provider) recipients.push({ userId: provider.userId, viewer: "provider" });
    }
    for (const recipient of recipients) {
      await notifyUser({
        body: "پشتیبانی انجام این کار را ثبت کرد",
        relatedServiceRequestId: locked.id,
        requestPublicId: locked.publicId,
        title: "کار به پایان رسید",
        transaction,
        type: NOTIFICATION_TYPES.requestCompleted,
        userId: recipient.userId,
        viewer: recipient.viewer,
      });
    }

    await recordAdminAudit(
      {
        action: "requests.complete",
        adminId: actor.adminId,
        module: MODULE,
        newValues: { reason: input.reason, status: "completed" },
        oldValues: { status: "in_progress" },
        request: actor.request,
        subject: { id: locked.id, type: SUBJECT },
      },
      transaction,
    );
    return { requestId: locked.publicId, status: "completed" as const };
  });
}

/** Takes a request back from one provider who has not answered yet. */
export async function withdrawAdminRequestLink(
  actor: Actor,
  publicId: string,
  linkId: string,
  input: { reason: string },
) {
  const now = systemClock.now();
  return runInTransaction(async (transaction) => {
    const locked = await lockServiceRequestByPublicId(transaction, publicId);
    if (!locked) throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست پیدا نشد.");
    if (locked.status !== "pending_provider") {
      throw new ApiError(409, API_ERROR_CODES.conflict, "فقط از درخواست منتظر پاسخ می‌توان دعوت را برداشت.");
    }
    const link = await lockRequestLinkById(transaction, locked.id, BigInt(linkId));
    if (!link) throw new ApiError(404, API_ERROR_CODES.notFound, "این دعوت پیدا نشد.");
    if (link.status !== "sent") {
      throw new ApiError(409, API_ERROR_CODES.conflict, "این خدمات‌دهنده قبلاً پاسخ داده یا دعوت برداشته شده است.");
    }

    await removeProviderLinkByAdmin(transaction, { adminId: actor.adminId, linkId: link.id, now, reason: input.reason });

    const provider = await findProviderUserIdByProfileId(link.providerProfileId);
    if (provider) {
      await notifyUser({
        body: "این درخواست توسط پشتیبانی از فهرست شما برداشته شد",
        relatedServiceRequestId: locked.id,
        requestPublicId: locked.publicId,
        title: "درخواست برداشته شد",
        transaction,
        type: NOTIFICATION_TYPES.requestCancelled,
        userId: provider.userId,
        viewer: "provider",
      });
    }

    await recordAdminAudit(
      {
        action: "requests.withdraw_provider",
        adminId: actor.adminId,
        metadata: { linkId: link.id, providerName: link.providerNameSnapshot },
        module: MODULE,
        newValues: { linkStatus: "removed", reason: input.reason },
        oldValues: { linkStatus: "sent" },
        request: actor.request,
        subject: { id: locked.id, type: SUBJECT },
      },
      transaction,
    );
    return { linkId, status: "removed" as const };
  });
}
