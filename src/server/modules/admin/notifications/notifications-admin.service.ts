import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  BROADCAST_AUDIT_ACTION,
  audienceWhere,
  campaignStats,
  countAudience,
  countNotificationsPerType,
  deliveryCounts,
  findCampaignAudit,
  findDelivery,
  findProvinceName,
  findUserBrief,
  insertBroadcastChunk,
  listAudienceChunk,
  listCampaignAudits,
  listCampaignRecipients,
  listDeliveryRows,
  listNotificationRows,
  requeueDeadDeliveries,
  requeueDelivery,
  sampleAudience,
  searchRecipients,
} from "@/server/modules/admin/notifications/notifications-admin.repository";
import type {
  AudienceInput,
  AudienceKind,
  BroadcastInput,
  DeliveriesQuery,
  NotificationsQuery,
} from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { getProvinceOptions } from "@/server/modules/admin/users/users.service";
import { runNotificationDeliveryJob } from "@/server/modules/notifications/notification.delivery";
import { buildNotificationData } from "@/server/modules/notifications/notification.templates";
import { MAX_DELIVERY_ATTEMPTS } from "@/server/modules/notifications/notification.types";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "notifications";
const CHUNK_SIZE = 500;
const CAMPAIGNS_PAGE_SIZE = 20;
const RECIPIENTS_PAGE_SIZE = 25;
const DELIVERIES_PAGE_SIZE = 25;

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

// ================================================================== audience

export interface ResolvedAudience {
  kind: AudienceKind;
  provinceId: number | null;
  provinceName: string | null;
  userId: string | null;
  userName: string | null;
}

async function resolveAudience(audience: AudienceInput): Promise<ResolvedAudience> {
  const resolved: ResolvedAudience = {
    kind: audience.kind,
    provinceId: audience.provinceId ?? null,
    provinceName: null,
    userId: audience.userId ?? null,
    userName: null,
  };
  if (audience.kind === "user" && audience.userId) {
    const user = await findUserBrief(audience.userId);
    if (!user || user.deletedAt || user.isActive !== 1) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "این کاربر حذف یا غیرفعال شده و اعلان دریافت نمی‌کند.", {
        fields: { "audience.userId": ["این کاربر حذف یا غیرفعال شده و اعلان دریافت نمی‌کند."] },
      });
    }
    resolved.userName = user.name ?? user.phone;
  }
  if (audience.kind === "province" && audience.provinceId) {
    resolved.provinceName = await findProvinceName(audience.provinceId);
    if (!resolved.provinceName) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "استان انتخاب‌شده معتبر نیست.", {
        fields: { "audience.provinceId": ["استان انتخاب‌شده معتبر نیست."] },
      });
    }
  }
  return resolved;
}

export interface AudiencePreview {
  count: number;
  sample: Array<{ id: string; name: string; phone: string }>;
}

export async function previewAudience(audience: AudienceInput): Promise<AudiencePreview> {
  await resolveAudience(audience);
  const where = audienceWhere(audience, systemClock.now());
  const [count, sample] = await Promise.all([countAudience(where), sampleAudience(where, 5)]);
  return {
    count,
    sample: sample.map((user) => ({ id: user.publicId, name: user.name ?? "بدون نام", phone: user.phone })),
  };
}

export async function findRecipients(q: string) {
  const rows = await searchRecipients(q);
  return rows.map((row) => ({
    id: row.publicId,
    image: row.image,
    isProvider: row.providerProfile !== null,
    name: row.name ?? "بدون نام",
    phone: row.phone,
  }));
}

export async function getComposeOptions() {
  return { provinces: await getProvinceOptions() };
}

// ==================================================================== send

/**
 * Sends one in-app notification per recipient through the same tables the
 * delivery job drains. The audit row is the campaign's record (who, to whom,
 * what); the notifications carry its id so history and stats can group them.
 * Rows go in batches of 500, each in its own short transaction.
 */
export async function sendBroadcast(actor: Actor, input: BroadcastInput): Promise<{ campaignId: string; sent: number }> {
  const audience = await resolveAudience(input.audience);
  const now = systemClock.now();
  const where = audienceWhere(input.audience, now);
  const recipients = await countAudience(where);

  if (recipients === 0) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "این مخاطبان در حال حاضر هیچ گیرنده‌ای ندارند.");
  }
  // The admin confirmed a number; refuse if the audience grew by more than 5% since the preview.
  if (recipients > input.expectedRecipients + Math.floor(input.expectedRecipients * 0.05)) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      `تعداد گیرندگان از ${input.expectedRecipients} به ${recipients} تغییر کرده است؛ پیش‌نمایش را دوباره ببینید و تأیید کنید.`,
    );
  }

  const campaignId = createPublicId();
  await recordAdminAudit({
    action: BROADCAST_AUDIT_ACTION,
    adminId: actor.adminId,
    metadata: {
      audience,
      body: input.body,
      campaignId,
      deepLink: input.deepLink,
      recipients,
      title: input.title,
    },
    module: MODULE,
    request: actor.request,
  });

  let sent = 0;
  let afterId = BigInt(0);
  try {
    for (;;) {
      const chunk = await listAudienceChunk(where, afterId, CHUNK_SIZE);
      if (chunk.length === 0) break;
      afterId = chunk.at(-1)!.id;
      sent += await runInTransaction((transaction) =>
        insertBroadcastChunk(
          transaction,
          chunk.map((user) => ({
            data: {
              ...buildNotificationData({
                deepLink: input.deepLink,
                eventKey: `admin_broadcast:${campaignId}:${user.publicId}`,
              }),
              campaignId,
              sentByAdminId: actor.adminId.toString(),
            },
            publicId: createPublicId(),
            userId: user.id,
          })),
          { body: input.body, title: input.title },
        ),
      );
      if (chunk.length < CHUNK_SIZE) break;
    }
  } catch (error) {
    // Earlier batches are already visible to their recipients; record how far the send got.
    await recordAdminAudit({
      action: "notifications.broadcast_interrupted",
      adminId: actor.adminId,
      metadata: { campaignId, recipients, sent },
      module: MODULE,
      request: actor.request,
    });
    throw new ApiError(
      500,
      API_ERROR_CODES.internalServerError,
      `ارسال پس از ${sent} گیرنده متوقف شد. بخش ارسال‌شده در تاریخچه دیده می‌شود؛ برای بقیه دوباره ارسال نکنید مگر پس از بررسی.`,
      { cause: error },
    );
  }

  return { campaignId, sent };
}

// =============================================================== campaigns

export interface CampaignSummary {
  audience: ResolvedAudience;
  body: string;
  campaignId: string;
  createdAt: string;
  deepLink: string | null;
  delivered: number;
  failed: number;
  plannedRecipients: number;
  queued: number;
  read: number;
  sender: string | null;
  skipped: number;
  title: string;
  total: number;
}

function toCampaign(
  row: { admin: { name: string } | null; createdAt: Date; metadata: unknown },
  stats: Map<string, { delivered: number; failed: number; queued: number; read: number; skipped: number; total: number }>,
): CampaignSummary | null {
  const meta = asRecord(row.metadata);
  const campaignId = typeof meta.campaignId === "string" ? meta.campaignId : null;
  if (!campaignId) return null;
  const audience = asRecord(meta.audience);
  const stat = stats.get(campaignId) ?? { delivered: 0, failed: 0, queued: 0, read: 0, skipped: 0, total: 0 };
  return {
    audience: {
      kind: (typeof audience.kind === "string" ? audience.kind : "all") as AudienceKind,
      provinceId: typeof audience.provinceId === "number" ? audience.provinceId : null,
      provinceName: typeof audience.provinceName === "string" ? audience.provinceName : null,
      userId: typeof audience.userId === "string" ? audience.userId : null,
      userName: typeof audience.userName === "string" ? audience.userName : null,
    },
    body: typeof meta.body === "string" ? meta.body : "",
    campaignId,
    createdAt: row.createdAt.toISOString(),
    deepLink: typeof meta.deepLink === "string" ? meta.deepLink : null,
    plannedRecipients: typeof meta.recipients === "number" ? meta.recipients : stat.total,
    sender: row.admin?.name ?? null,
    title: typeof meta.title === "string" ? meta.title : "",
    ...stat,
  };
}

export async function listCampaigns(page: number) {
  const { rows, total } = await listCampaignAudits((page - 1) * CAMPAIGNS_PAGE_SIZE, CAMPAIGNS_PAGE_SIZE);
  const ids = rows
    .map((row) => asRecord(row.metadata).campaignId)
    .filter((value): value is string => typeof value === "string");
  const stats = await campaignStats(ids);
  return {
    items: rows.map((row) => toCampaign(row, stats)).filter((item): item is CampaignSummary => item !== null),
    page,
    pageCount: Math.max(1, Math.ceil(total / CAMPAIGNS_PAGE_SIZE)),
    perPage: CAMPAIGNS_PAGE_SIZE,
    total,
  };
}

export async function getCampaign(campaignId: string, input: { page: number; read: "all" | "read" | "unread" }) {
  const audit = await findCampaignAudit(campaignId);
  if (!audit) return null;
  const [stats, recipients] = await Promise.all([
    campaignStats([campaignId]),
    listCampaignRecipients(campaignId, input.read, (input.page - 1) * RECIPIENTS_PAGE_SIZE, RECIPIENTS_PAGE_SIZE),
  ]);
  const summary = toCampaign(audit, stats);
  if (!summary) return null;
  return {
    recipients: {
      items: recipients.rows.map((row) => ({
        createdAt: row.createdAt.toISOString(),
        deliveries: row.notificationDeliveries.map((delivery) => ({
          channel: delivery.channel,
          error: delivery.errorMessage,
          id: delivery.id.toString(),
          status: delivery.status,
        })),
        id: row.publicId,
        readAt: iso(row.readAt),
        user: row.user
          ? { id: row.user.publicId, image: row.user.image, name: row.user.name ?? "بدون نام", phone: row.user.phone }
          : null,
      })),
      page: input.page,
      pageCount: Math.max(1, Math.ceil(recipients.total / RECIPIENTS_PAGE_SIZE)),
      perPage: RECIPIENTS_PAGE_SIZE,
      read: input.read,
      total: recipients.total,
    },
    summary,
  };
}
export type AdminCampaignDetail = NonNullable<Awaited<ReturnType<typeof getCampaign>>>;

// ================================================================ explorer

export async function listNotifications(query: NotificationsQuery) {
  const now = systemClock.now();
  const [{ rows, total }, types] = await Promise.all([listNotificationRows(query, now), countNotificationsPerType()]);
  return {
    items: rows.map((row) => {
      const data = asRecord(row.data);
      return {
        body: row.body,
        campaignId: typeof data.campaignId === "string" ? data.campaignId : null,
        createdAt: row.createdAt.toISOString(),
        deepLink: typeof data.deepLink === "string" ? data.deepLink : null,
        deliveries: row.notificationDeliveries.map((delivery) => ({
          attempts: delivery.attemptsCount,
          channel: delivery.channel,
          error: delivery.errorMessage,
          id: delivery.id.toString(),
          status: delivery.status,
        })),
        id: row.publicId,
        readAt: iso(row.readAt),
        recipient:
          row.recipientType === "admin"
            ? { id: null, image: null, kind: "admin" as const, name: row.admin?.name ?? "مدیر", phone: null }
            : {
                id: row.user?.publicId ?? null,
                image: row.user?.image ?? null,
                kind: "user" as const,
                name: row.user?.name ?? "بدون نام",
                phone: row.user?.phone ?? null,
              },
        requestId: row.serviceRequest?.publicId ?? null,
        title: row.title,
        type: row.type,
      };
    }),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    total,
    types,
  };
}
export type AdminNotificationList = Awaited<ReturnType<typeof listNotifications>>;
export type AdminNotificationItem = AdminNotificationList["items"][number];

// ================================================================== queue

export async function getDeliveryHealth(query: DeliveriesQuery) {
  const [counts, list] = await Promise.all([deliveryCounts(), listDeliveryRows(query, DELIVERIES_PAGE_SIZE)]);
  const totals = { delivered: 0, queued: 0, skipped: 0 };
  const byChannel: Record<string, Record<string, number>> = {};
  for (const row of counts.byStatus) {
    byChannel[row.channel] ??= {};
    byChannel[row.channel]![row.status] = (byChannel[row.channel]![row.status] ?? 0) + row.count;
    if (row.status === "delivered" || row.status === "sent") totals.delivered += row.count;
    if (row.status === "queued") totals.queued += row.count;
    if (row.status === "skipped") totals.skipped += row.count;
  }
  return {
    byChannel,
    deliveries: {
      items: list.rows.map((row) => ({
        attempts: row.attemptsCount,
        channel: row.channel,
        error: row.errorMessage,
        failedAt: iso(row.failedAt),
        id: row.id.toString(),
        isDead: row.status === "failed" && row.attemptsCount >= MAX_DELIVERY_ATTEMPTS,
        notification: {
          id: row.notification.publicId,
          title: row.notification.title,
          type: row.notification.type,
          user: row.notification.user
            ? { id: row.notification.user.publicId, name: row.notification.user.name ?? "بدون نام", phone: row.notification.user.phone }
            : null,
        },
        queuedAt: row.queuedAt.toISOString(),
        status: row.status,
        updatedAt: row.updatedAt.toISOString(),
      })),
      page: query.page,
      pageCount: Math.max(1, Math.ceil(list.total / DELIVERIES_PAGE_SIZE)),
      perPage: DELIVERIES_PAGE_SIZE,
      total: list.total,
    },
    maxAttempts: MAX_DELIVERY_ATTEMPTS,
    summary: {
      dead: counts.dead,
      delivered: totals.delivered,
      oldestQueuedAt: iso(counts.oldestQueuedAt),
      queued: totals.queued,
      retrying: counts.retrying,
      skipped: totals.skipped,
    },
  };
}
export type AdminDeliveryHealth = Awaited<ReturnType<typeof getDeliveryHealth>>;

export async function replayDelivery(actor: Actor, deliveryId: string): Promise<void> {
  const id = BigInt(deliveryId);
  const delivery = await findDelivery(id);
  if (!delivery) throw new ApiError(404, API_ERROR_CODES.notFound, "این تحویل پیدا نشد.");
  if (delivery.status !== "failed") {
    throw new ApiError(409, API_ERROR_CODES.conflict, "فقط تحویل‌های ناموفق را می‌توان دوباره در صف گذاشت.");
  }
  await runInTransaction(async (transaction) => {
    const updated = await requeueDelivery(transaction, id, systemClock.now());
    if (updated === 0) throw new ApiError(409, API_ERROR_CODES.conflict, "وضعیت این تحویل همین حالا تغییر کرد؛ صفحه را تازه کنید.");
    await recordAdminAudit(
      {
        action: "notifications.delivery_replay",
        adminId: actor.adminId,
        metadata: { attempts: delivery.attemptsCount, channel: delivery.channel, deliveryId, error: delivery.errorMessage },
        module: MODULE,
        request: actor.request,
      },
      transaction,
    );
  });
}

export async function replayDeadDeliveries(actor: Actor): Promise<{ requeued: number }> {
  return runInTransaction(async (transaction) => {
    const requeued = await requeueDeadDeliveries(transaction, systemClock.now());
    await recordAdminAudit(
      {
        action: "notifications.delivery_replay_all",
        adminId: actor.adminId,
        metadata: { requeued },
        module: MODULE,
        request: actor.request,
      },
      transaction,
    );
    return { requeued };
  });
}

/** Drains one batch of the queue right away instead of waiting for the scheduled job. */
export async function processQueueNow(actor: Actor) {
  const result = await runNotificationDeliveryJob(200);
  await recordAdminAudit({
    action: "notifications.queue_run",
    adminId: actor.adminId,
    metadata: result,
    module: MODULE,
    request: actor.request,
  });
  return result;
}

/** Stopped (dead-letter) deliveries, flagged on the section's queue tab. */
export async function countStoppedDeliveries(): Promise<number> {
  return (await deliveryCounts()).dead;
}

/** A recipient to pre-select in the composer (`?user=` from a user or provider page). */
export async function getRecipient(publicId: string) {
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(publicId)) return null;
  return (await findRecipients(publicId)).find((row) => row.id === publicId) ?? null;
}
