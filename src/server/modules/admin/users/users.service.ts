import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { listAuditLogsForSubject } from "@/server/modules/admin/audit/admin-audit.repository";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countUsersPerStatus,
  endModerationAction,
  findActiveRestrictions,
  findCityProvince,
  findLocationNames,
  findUserByPhone,
  findUserCore,
  findUserIdentity,
  findUserNote,
  insertModerationAction,
  insertUserNote,
  listModerationHistory,
  listProvinceOptions,
  listRecentOtpAttempts,
  listUserLands,
  listUserNotes,
  listUserNotifications,
  listUserPayments,
  listUserRequests,
  listUserSessions,
  listUsers,
  loadProviderDetail,
  loadRecentActivity,
  loadUserCounters,
  lockUserForUpdate,
  provinceExists,
  revokeUserSessions,
  updateUserNote,
  updateUserRow,
} from "@/server/modules/admin/users/users.repository";
import type {
  ModerationAction,
  UserModerationInput,
  UserStatus,
  UserUpdateInput,
  UsersListQuery,
} from "@/server/modules/admin/users/users.schemas";

const AUDIT_SUBJECT = "user";

type RequestStatus = "awaiting_send" | "pending_provider" | "in_progress" | "completed" | "cancelled";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

function deriveStatus(input: {
  deletedAt: Date | null;
  isActive: number;
  restrictions: Array<{ action: string; endsAt: Date | null }>;
}): { restrictionEndsAt: string | null; status: UserStatus } {
  if (input.deletedAt) return { restrictionEndsAt: null, status: "deleted" };
  const ban = input.restrictions.find((row) => row.action === "ban");
  if (ban) return { restrictionEndsAt: iso(ban.endsAt), status: "banned" };
  const suspension = input.restrictions.find((row) => row.action === "suspend");
  if (suspension) return { restrictionEndsAt: iso(suspension.endsAt), status: "suspended" };
  return { restrictionEndsAt: null, status: input.isActive === 1 ? "active" : "inactive" };
}

/** `ends_at` must be after `starts_at` (DB check), even for a restriction that starts now. */
function liftedAt(startsAt: Date, now: Date): Date {
  return startsAt < now ? now : new Date(startsAt.getTime() + 1);
}

function notFound(): never {
  throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر پیدا نشد.");
}

// ------------------------------------------------------------------- list

export interface AdminUserListItem {
  city: string | null;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  image: string | null;
  isProvider: boolean;
  landsCount: number;
  lastLoginAt: string | null;
  name: string;
  phone: string;
  providerApproved: boolean;
  province: string | null;
  requestsCount: number;
  restrictionEndsAt: string | null;
  status: UserStatus;
}

export interface AdminUserList {
  counts: Record<"all" | UserStatus, number>;
  items: AdminUserListItem[];
  page: number;
  pageCount: number;
  perPage: number;
  provinces: Array<{ id: string; name: string }>;
  total: number;
}

export async function listAdminUsers(query: UsersListQuery): Promise<AdminUserList> {
  const now = systemClock.now();
  const filters = {
    provinceId: query.province,
    q: query.q,
    role: query.role,
  };

  const [{ rows, total }, counts, provinces] = await Promise.all([
    listUsers({
      filters: { ...filters, status: query.status },
      now,
      skip: (query.page - 1) * query.perPage,
      sort: query.sort,
      take: query.perPage,
    }),
    countUsersPerStatus(filters, now),
    getProvinceOptions(),
  ]);

  return {
    counts,
    items: rows.map((row) => {
      const { restrictionEndsAt, status } = deriveStatus({
        deletedAt: row.deletedAt,
        isActive: row.isActive,
        restrictions: row.userModerationActions,
      });
      return {
        city: row.city?.name ?? null,
        createdAt: row.createdAt.toISOString(),
        deletedAt: iso(row.deletedAt),
        id: row.publicId,
        image: row.image,
        isProvider: row.providerProfile !== null,
        landsCount: row._count.lands,
        lastLoginAt: iso(row.lastLoginAt),
        name: row.name,
        phone: row.phone,
        providerApproved: Boolean(row.providerProfile?.approvedAt),
        province: row.province?.name ?? null,
        requestsCount: row._count.consumerRequests,
        restrictionEndsAt,
        status,
      };
    }),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    provinces,
    total,
  };
}

export async function getProvinceOptions(): Promise<Array<{ id: string; name: string }>> {
  const provinces = await listProvinceOptions();
  return provinces.map((province) => ({ id: province.id.toString(), name: province.name }));
}

// ----------------------------------------------------------------- header

export interface AdminUserHeader {
  city: { id: string; name: string } | null;
  counters: {
    activeSessions: number;
    landArea: number;
    landsCount: number;
    notes: number;
    paidTotal: string;
    requests: Record<RequestStatus, number> & { total: number };
    spentTotal: string;
    unreadNotifications: number;
  };
  createdAt: string;
  deletedAt: string | null;
  id: string;
  image: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  locale: string;
  name: string;
  phone: string;
  phoneVerifiedAt: string | null;
  provider: { approvedAt: string | null; isActive: boolean; isAvailable: boolean } | null;
  province: { id: string; name: string } | null;
  restriction: {
    action: "ban" | "suspend";
    adminName: string;
    endsAt: string | null;
    reason: string;
    startsAt: string;
  } | null;
  restrictionEndsAt: string | null;
  status: UserStatus;
  timezone: string;
  updatedAt: string;
}

/** Internal id + header payload; `null` when the user does not exist. */
export async function getAdminUserHeader(
  publicId: string,
): Promise<{ header: AdminUserHeader; internalId: bigint; phone: string } | null> {
  const now = systemClock.now();
  const user = await findUserCore(publicId, now);
  if (!user) return null;

  const counters = await loadUserCounters(user.id, now);
  const requests: Record<RequestStatus, number> = {
    awaiting_send: 0,
    cancelled: 0,
    completed: 0,
    in_progress: 0,
    pending_provider: 0,
  };
  for (const row of counters.requestsByStatus) requests[row.status] = row.count;

  const { restrictionEndsAt, status } = deriveStatus({
    deletedAt: user.deletedAt,
    isActive: user.isActive,
    restrictions: user.userModerationActions,
  });
  const restriction =
    user.userModerationActions.find((row) => row.action === "ban") ?? user.userModerationActions[0];

  return {
    header: {
      city: user.city ? { id: user.city.id.toString(), name: user.city.name } : null,
      counters: {
        activeSessions: counters.activeSessions,
        landArea: counters.landArea,
        landsCount: counters.landsCount,
        notes: counters.notes,
        paidTotal: counters.paidTotal.toString(),
        requests: { ...requests, total: Object.values(requests).reduce((sum, count) => sum + count, 0) },
        spentTotal: counters.spentTotal.toString(),
        unreadNotifications: counters.unreadNotifications,
      },
      createdAt: user.createdAt.toISOString(),
      deletedAt: iso(user.deletedAt),
      id: user.publicId,
      image: user.image,
      isActive: user.isActive === 1,
      lastLoginAt: iso(user.lastLoginAt),
      lastLoginIp: user.lastLoginIp,
      locale: user.locale,
      name: user.name,
      phone: user.phone,
      phoneVerifiedAt: iso(user.phoneVerifiedAt),
      provider: user.providerProfile
        ? {
            approvedAt: iso(user.providerProfile.approvedAt),
            isActive: user.providerProfile.isActive === 1,
            isAvailable: user.providerProfile.isAvailable === 1,
          }
        : null,
      province: user.province ? { id: user.province.id.toString(), name: user.province.name } : null,
      restriction:
        restriction && !user.deletedAt
          ? {
              action: restriction.action as "ban" | "suspend",
              adminName: restriction.admin.name,
              endsAt: iso(restriction.endsAt),
              reason: restriction.reason,
              startsAt: restriction.startsAt.toISOString(),
            }
          : null,
      restrictionEndsAt,
      status,
      timezone: user.timezone,
      updatedAt: user.updatedAt.toISOString(),
    },
    internalId: user.id,
    phone: user.phone,
  };
}

// ------------------------------------------------------------------- tabs

export type ActivityKind = "request" | "land" | "payment" | "moderation" | "login";

export interface AdminUserActivity {
  at: string;
  detail: string | null;
  href: string | null;
  id: string;
  kind: ActivityKind;
  status: string | null;
  title: string;
}

export interface AdminUserNote {
  adminName: string | null;
  body: string;
  createdAt: string;
  id: string;
  isPinned: boolean;
}

const MODERATION_LABELS: Record<ModerationAction, string> = {
  activate: "فعال‌سازی حساب",
  ban: "مسدودسازی دائمی",
  deactivate: "غیرفعال‌سازی حساب",
  suspend: "تعلیق موقت",
  unban: "رفع محدودیت",
  warning: "ثبت اخطار",
};

const PLATFORM_LABELS: Record<string, string> = {
  android: "اندروید",
  ios: "iOS",
  pwa: "اپ نصب‌شده",
  unknown: "نامشخص",
  web: "مرورگر",
};

export async function getUserOverviewTab(userId: bigint) {
  const [activity, notes] = await Promise.all([loadRecentActivity(userId, 8), listUserNotes(userId)]);

  const items: AdminUserActivity[] = [
    ...activity.requests.map((row) => ({
      at: row.createdAt.toISOString(),
      detail: null,
      href: `/admins/requests/${row.publicId}`,
      id: `request-${row.publicId}`,
      kind: "request" as const,
      status: row.status,
      title: `ثبت درخواست ${row.serviceNameSnapshot}`,
    })),
    ...activity.lands.map((row) => ({
      at: row.createdAt.toISOString(),
      detail: null,
      href: null,
      id: `land-${row.publicId}`,
      kind: "land" as const,
      status: null,
      title: `افزودن زمین «${row.title}»`,
    })),
    ...activity.payments.map((row) => ({
      at: row.createdAt.toISOString(),
      detail: row.amountToman.toString(),
      href: `/admins/billing/payments/${row.publicId}`,
      id: `payment-${row.publicId}`,
      kind: "payment" as const,
      status: row.status,
      title: "پرداخت اشتراک",
    })),
    ...activity.moderation.map((row) => ({
      at: row.createdAt.toISOString(),
      detail: row.reason,
      href: null,
      id: `moderation-${row.id}`,
      kind: "moderation" as const,
      status: row.action,
      title: `${MODERATION_LABELS[row.action]} توسط ${row.admin.name}`,
    })),
    ...activity.sessions.map((row) => ({
      at: row.createdAt.toISOString(),
      detail: row.deviceName,
      href: null,
      id: `session-${row.id}`,
      kind: "login" as const,
      status: null,
      title: `ورود از ${PLATFORM_LABELS[row.platform] ?? row.platform}`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 14);

  return {
    activity: items,
    notes: notes.map<AdminUserNote>((note) => ({
      adminName: note.admin?.name ?? null,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      id: note.publicId,
      isPinned: note.isPinned === 1,
    })),
  };
}

export async function getUserLandsTab(userId: bigint) {
  const lands = await listUserLands(userId);
  return lands.map((land) => ({
    areaSquareMeters: Number(land.areaSquareMeters),
    createdAt: land.createdAt.toISOString(),
    deletedAt: iso(land.deletedAt),
    description: land.description,
    id: land.publicId,
    isActive: land.isActive === 1,
    latitude: Number(land.latitude),
    longitude: Number(land.longitude),
    requestsCount: land._count.serviceRequests,
    title: land.title,
  }));
}
export type AdminUserLand = Awaited<ReturnType<typeof getUserLandsTab>>[number];

const REQUESTS_PAGE_SIZE = 15;

export async function getUserRequestsTab(userId: bigint, input: { page: number; status: string }) {
  const { rows, total } = await listUserRequests({
    skip: (input.page - 1) * REQUESTS_PAGE_SIZE,
    status: input.status,
    take: REQUESTS_PAGE_SIZE,
    userId,
  });
  return {
    items: rows.map((row) => ({
      agreedPriceToman: row.agreedPriceToman?.toString() ?? null,
      cancelReason: row.cancelReason,
      cancelledBy: row.cancelledBy,
      category: row.serviceCategoryNameSnapshot,
      completedAt: iso(row.completedAt),
      createdAt: row.createdAt.toISOString(),
      dates: row.serviceRequestDates.map((date) => date.scheduledDate.toISOString().slice(0, 10)),
      id: row.publicId,
      landTitle: row.landTitleSnapshot,
      providerName: row.assignedProviderNameSnapshot,
      providersContacted: row._count.serviceRequestProviders,
      serviceName: row.serviceNameSnapshot,
      status: row.status,
    })),
    page: input.page,
    pageCount: Math.max(1, Math.ceil(total / REQUESTS_PAGE_SIZE)),
    status: input.status,
    total,
  };
}
export type AdminUserRequests = Awaited<ReturnType<typeof getUserRequestsTab>>;

export async function getUserProviderTab(userId: bigint) {
  const detail = await loadProviderDetail(userId);
  if (!detail) return null;
  const { profile } = detail;
  const toCounts = (rows: Array<{ count: number; status: string }>) =>
    Object.fromEntries(rows.map((row) => [row.status, row.count])) as Record<string, number>;

  return {
    approvedAt: iso(profile.approvedAt),
    approvedBy: profile.approvedByAdmin?.name ?? null,
    bio: profile.bio,
    createdAt: profile.createdAt.toISOString(),
    galleryCount: profile._count.galleryImages,
    inbox: toCounts(detail.inbox),
    isActive: profile.isActive === 1,
    isAvailable: profile.isAvailable === 1,
    jobs: toCounts(detail.jobs),
    recentJobs: detail.recentJobs.map((job) => ({
      agreedPriceToman: job.agreedPriceToman?.toString() ?? null,
      consumerId: job.consumer.publicId,
      consumerName: job.consumerNameSnapshot,
      createdAt: job.createdAt.toISOString(),
      id: job.publicId,
      serviceName: job.serviceNameSnapshot,
      status: job.status,
    })),
    revenue: detail.revenue.toString(),
    services: profile.providerServices.map((service) => ({
      category: service.service.category.name,
      description: service.description,
      isActive: service.isActive === 1,
      name: service.service.name,
      priceToman: service.priceToman.toString(),
      pricingUnit: service.pricingUnit,
      updatedAt: service.updatedAt.toISOString(),
    })),
    subscriptions: profile.providerSubscriptions.map((subscription) => ({
      amountToman: subscription.amountToman.toString(),
      cancellationReason: subscription.cancellationReason,
      endsAt: iso(subscription.endsAt),
      grantedBy: subscription.grantedByAdmin?.name ?? null,
      id: subscription.publicId,
      planName: subscription.planNameSnapshot,
      source: subscription.source,
      startsAt: iso(subscription.startsAt),
      status: subscription.status,
    })),
    workArea:
      profile.workLatitude !== null && profile.workLongitude !== null
        ? {
            latitude: Number(profile.workLatitude),
            longitude: Number(profile.workLongitude),
            radiusKm: profile.workRadiusKm,
          }
        : null,
  };
}
export type AdminUserProvider = NonNullable<Awaited<ReturnType<typeof getUserProviderTab>>>;

export async function getUserPaymentsTab(userId: bigint) {
  const payments = await listUserPayments(userId);
  return payments.map((payment) => ({
    amountToman: payment.amountToman.toString(),
    authority: payment.authority,
    createdAt: payment.createdAt.toISOString(),
    failureMessage: payment.failureMessage,
    gateway: payment.gateway,
    id: payment.publicId,
    paidAt: iso(payment.paidAt),
    planName: payment.subscription?.planNameSnapshot ?? null,
    reference: payment.transactionReference,
    refunds: payment.paymentRefunds.map((refund) => ({
      amountToman: refund.amountToman.toString(),
      createdAt: refund.createdAt.toISOString(),
      reason: refund.reason,
      status: refund.status,
    })),
    status: payment.status,
  }));
}
export type AdminUserPayment = Awaited<ReturnType<typeof getUserPaymentsTab>>[number];

export async function getUserSessionsTab(userId: bigint, phone: string) {
  const now = systemClock.now();
  const [sessions, otps] = await Promise.all([listUserSessions(userId), listRecentOtpAttempts(phone)]);
  return {
    otps: otps.map((otp) => ({
      attempts: otp.attemptsCount,
      consumedAt: iso(otp.consumedAt),
      createdAt: otp.createdAt.toISOString(),
      expired: !otp.consumedAt && otp.expiresAt <= now,
      id: otp.id.toString(),
      maxAttempts: otp.maxAttempts,
      purpose: otp.purpose,
      requestedIp: otp.requestedIp,
    })),
    sessions: sessions.map((session) => ({
      createdAt: session.createdAt.toISOString(),
      deviceName: session.deviceName,
      expiresAt: session.expiresAt.toISOString(),
      id: session.publicId,
      ipAddress: session.ipAddress,
      isActive: !session.revokedAt && session.expiresAt > now,
      lastActivityAt: session.lastActivityAt.toISOString(),
      platform: session.platform,
      revokedAt: iso(session.revokedAt),
      userAgent: session.userAgent,
    })),
  };
}
export type AdminUserSessions = Awaited<ReturnType<typeof getUserSessionsTab>>;

export async function getUserNotificationsTab(userId: bigint) {
  const notifications = await listUserNotifications(userId);
  return notifications.map((notification) => ({
    body: notification.body,
    channels: notification.notificationDeliveries.map((delivery) => ({
      channel: delivery.channel,
      status: delivery.status,
    })),
    createdAt: notification.createdAt.toISOString(),
    id: notification.publicId,
    readAt: iso(notification.readAt),
    title: notification.title,
    type: notification.type,
  }));
}
export type AdminUserNotification = Awaited<ReturnType<typeof getUserNotificationsTab>>[number];

const AUDIT_LABELS: Record<string, string> = {
  "users.delete": "حذف حساب",
  "users.moderation": "تغییر وضعیت حساب",
  "users.note.create": "افزودن یادداشت",
  "users.note.delete": "حذف یادداشت",
  "users.note.pin": "سنجاق یادداشت",
  "users.note.unpin": "برداشتن سنجاق یادداشت",
  "users.restore": "بازگردانی حساب",
  "users.sessions.revoke": "خروج اجباری از نشست‌ها",
  "users.update": "ویرایش اطلاعات",
};

export async function getUserHistoryTab(userId: bigint) {
  const [moderation, audits] = await Promise.all([
    listModerationHistory(userId),
    listAuditLogsForSubject(AUDIT_SUBJECT, userId, 100),
  ]);

  // Audit rows keep location IDs; show the names instead.
  const values = audits.flatMap((log) => [log.oldValues, log.newValues]) as Array<Record<string, unknown> | null>;
  const idsOf = (key: string) => [
    ...new Set(
      values.flatMap((value) => {
        const id = value?.[key];
        return typeof id === "string" && /^\d+$/.test(id) ? [id] : [];
      }),
    ),
  ];
  const names = await findLocationNames(idsOf("provinceId").map(BigInt), idsOf("cityId").map(BigInt));
  const withNames = (value: unknown) => {
    if (!value || typeof value !== "object") return null;
    const record = { ...(value as Record<string, unknown>) };
    if (typeof record.provinceId === "string") record.provinceId = names.provinces.get(record.provinceId) ?? record.provinceId;
    if (typeof record.cityId === "string") record.cityId = names.cities.get(record.cityId) ?? record.cityId;
    return record;
  };

  return {
    audits: audits.map((log) => ({
      action: log.action,
      adminName: log.admin?.name ?? null,
      createdAt: log.createdAt.toISOString(),
      id: log.id.toString(),
      ipAddress: log.ipAddress,
      label: AUDIT_LABELS[log.action] ?? log.action,
      newValues: withNames(log.newValues),
      oldValues: withNames(log.oldValues),
    })),
    moderation: moderation.map((row) => ({
      action: row.action,
      adminName: row.admin.name,
      createdAt: row.createdAt.toISOString(),
      endsAt: iso(row.endsAt),
      id: row.id.toString(),
      reason: row.reason,
      startsAt: row.startsAt.toISOString(),
    })),
  };
}
export type AdminUserHistory = Awaited<ReturnType<typeof getUserHistoryTab>>;

// -------------------------------------------------------------- mutations

interface Actor {
  adminId: bigint;
  request: NextRequest;
}

async function requireUser(publicId: string) {
  const user = await findUserIdentity(publicId);
  if (!user) notFound();
  return user;
}

function assertNotDeleted(user: { deletedAt: Date | null }) {
  if (user.deletedAt) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "این حساب حذف شده است. برای این کار ابتدا آن را بازگردانی کنید.",
    );
  }
}

export async function updateAdminUser(actor: Actor, publicId: string, input: UserUpdateInput) {
  const user = await requireUser(publicId);
  assertNotDeleted(user);

  await runInTransaction(async (transaction) => {
    await lockUserForUpdate(transaction, user.id);

    if (input.phone !== user.phone) {
      const owner = await findUserByPhone(transaction, input.phone);
      if (owner && owner.id !== user.id) {
        throw new ApiError(409, API_ERROR_CODES.conflict, "این شماره موبایل متعلق به حساب دیگری است.", {
          fields: { phone: ["این شماره موبایل متعلق به حساب دیگری است."] },
        });
      }
    }

    const provinceId = input.provinceId === null ? null : BigInt(input.provinceId);
    const cityId = input.cityId === null ? null : BigInt(input.cityId);

    if (provinceId !== null && !(await provinceExists(transaction, provinceId))) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "استان انتخاب‌شده معتبر نیست.", {
        fields: { provinceId: ["استان انتخاب‌شده معتبر نیست."] },
      });
    }
    if (cityId !== null) {
      const city = await findCityProvince(transaction, cityId);
      if (!city || city.provinceId !== provinceId) {
        throw new ApiError(400, API_ERROR_CODES.validationFailed, "شهر با استان انتخاب‌شده هم‌خوان نیست.", {
          fields: { cityId: ["شهر با استان انتخاب‌شده هم‌خوان نیست."] },
        });
      }
    }

    const phoneChanged = input.phone !== user.phone;
    await updateUserRow(transaction, user.id, {
      cityId,
      name: input.name,
      phone: input.phone,
      provinceId,
      ...(phoneChanged ? { phoneVerifiedAt: null } : {}),
    });

    // A new number must sign in again with an OTP sent to that number.
    if (phoneChanged) {
      await revokeUserSessions(transaction, { now: systemClock.now(), userId: user.id });
    }

    await recordAdminAudit(
      {
        action: "users.update",
        adminId: actor.adminId,
        module: "users",
        newValues: { cityId, name: input.name, phone: input.phone, provinceId },
        oldValues: { cityId: user.cityId, name: user.name, phone: user.phone, provinceId: user.provinceId },
        request: actor.request,
        subject: { id: user.id, type: AUDIT_SUBJECT },
      },
      transaction,
    );
  });
}

export async function moderateAdminUser(actor: Actor, publicId: string, input: UserModerationInput) {
  const user = await requireUser(publicId);
  assertNotDeleted(user);
  const now = systemClock.now();

  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (input.action === "suspend" && (!endsAt || endsAt.getTime() <= now.getTime() + 60_000)) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "پایان تعلیق باید در آینده باشد.", {
      fields: { endsAt: ["پایان تعلیق باید در آینده باشد."] },
    });
  }

  await runInTransaction(async (transaction) => {
    await lockUserForUpdate(transaction, user.id);
    const restrictions = await findActiveRestrictions(transaction, user.id, now);
    let revoked = 0;

    switch (input.action) {
      case "activate":
        if (user.isActive === 1) {
          throw new ApiError(409, API_ERROR_CODES.conflict, "حساب همین حالا فعال است.");
        }
        await updateUserRow(transaction, user.id, { isActive: 1 });
        break;
      case "deactivate":
        if (user.isActive !== 1) {
          throw new ApiError(409, API_ERROR_CODES.conflict, "حساب همین حالا غیرفعال است.");
        }
        await updateUserRow(transaction, user.id, { isActive: 0 });
        revoked = await revokeUserSessions(transaction, { now, userId: user.id });
        break;
      case "suspend":
      case "ban":
        if (restrictions.some((row) => row.action === "ban")) {
          throw new ApiError(409, API_ERROR_CODES.conflict, "حساب همین حالا مسدود است.");
        }
        // A new restriction replaces any running suspension.
        for (const row of restrictions) {
          await endModerationAction(transaction, row.id, liftedAt(row.startsAt, now));
        }
        revoked = await revokeUserSessions(transaction, { now, userId: user.id });
        break;
      case "unban":
        if (restrictions.length === 0) {
          throw new ApiError(409, API_ERROR_CODES.conflict, "این حساب محدودیت فعالی ندارد.");
        }
        for (const row of restrictions) {
          await endModerationAction(transaction, row.id, liftedAt(row.startsAt, now));
        }
        break;
      case "warning":
        break;
    }

    await insertModerationAction(transaction, {
      action: input.action,
      adminId: actor.adminId,
      endsAt: input.action === "suspend" ? endsAt : null,
      reason: input.reason,
      startsAt: now,
      userId: user.id,
    });

    await recordAdminAudit(
      {
        action: "users.moderation",
        adminId: actor.adminId,
        metadata: { revokedSessions: revoked },
        module: "users",
        newValues: { action: input.action, endsAt, reason: input.reason },
        request: actor.request,
        subject: { id: user.id, type: AUDIT_SUBJECT },
      },
      transaction,
    );
  });
}

export async function revokeAdminUserSessions(actor: Actor, publicId: string, sessionPublicId?: string) {
  const user = await requireUser(publicId);
  return runInTransaction(async (transaction) => {
    const revoked = await revokeUserSessions(transaction, {
      now: systemClock.now(),
      sessionPublicId,
      userId: user.id,
    });
    if (sessionPublicId && revoked === 0) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "نشست فعالی با این شناسه پیدا نشد.");
    }
    await recordAdminAudit(
      {
        action: "users.sessions.revoke",
        adminId: actor.adminId,
        metadata: { revoked, sessionId: sessionPublicId ?? "all" },
        module: "users",
        request: actor.request,
        subject: { id: user.id, type: AUDIT_SUBJECT },
      },
      transaction,
    );
    return { revoked };
  });
}

export async function deleteAdminUser(actor: Actor, publicId: string, reason: string) {
  const user = await requireUser(publicId);
  assertNotDeleted(user);
  const now = systemClock.now();
  await runInTransaction(async (transaction) => {
    await lockUserForUpdate(transaction, user.id);
    await updateUserRow(transaction, user.id, { deletedAt: now });
    const revoked = await revokeUserSessions(transaction, { now, userId: user.id });
    await recordAdminAudit(
      {
        action: "users.delete",
        adminId: actor.adminId,
        metadata: { reason, revokedSessions: revoked },
        module: "users",
        request: actor.request,
        subject: { id: user.id, type: AUDIT_SUBJECT },
      },
      transaction,
    );
  });
}

export async function restoreAdminUser(actor: Actor, publicId: string) {
  const user = await requireUser(publicId);
  if (!user.deletedAt) {
    throw new ApiError(409, API_ERROR_CODES.conflict, "این حساب حذف نشده است.");
  }
  await runInTransaction(async (transaction) => {
    await updateUserRow(transaction, user.id, { deletedAt: null });
    await recordAdminAudit(
      {
        action: "users.restore",
        adminId: actor.adminId,
        module: "users",
        request: actor.request,
        subject: { id: user.id, type: AUDIT_SUBJECT },
      },
      transaction,
    );
  });
}

export async function addAdminUserNote(
  actor: Actor,
  publicId: string,
  input: { body: string; isPinned: boolean },
) {
  const user = await requireUser(publicId);
  const note = await insertUserNote({
    adminId: actor.adminId,
    body: input.body,
    isPinned: input.isPinned ? 1 : 0,
    publicId: createPublicId(),
    userId: user.id,
  });
  await recordAdminAudit({
    action: "users.note.create",
    adminId: actor.adminId,
    module: "users",
    newValues: { note: note.publicId },
    request: actor.request,
    subject: { id: user.id, type: AUDIT_SUBJECT },
  });
  return { id: note.publicId };
}

async function requireNote(userPublicId: string, notePublicId: string) {
  const user = await requireUser(userPublicId);
  const note = await findUserNote(user.id, notePublicId);
  if (!note) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "یادداشت پیدا نشد.");
  }
  return { note, user };
}

export async function setAdminUserNotePinned(
  actor: Actor,
  userPublicId: string,
  notePublicId: string,
  isPinned: boolean,
) {
  const { note, user } = await requireNote(userPublicId, notePublicId);
  await updateUserNote(note.id, { isPinned: isPinned ? 1 : 0 });
  await recordAdminAudit({
    action: isPinned ? "users.note.pin" : "users.note.unpin",
    adminId: actor.adminId,
    module: "users",
    newValues: { note: notePublicId },
    request: actor.request,
    subject: { id: user.id, type: AUDIT_SUBJECT },
  });
}

export async function deleteAdminUserNote(actor: Actor, userPublicId: string, notePublicId: string) {
  const { note, user } = await requireNote(userPublicId, notePublicId);
  await updateUserNote(note.id, { deletedAt: systemClock.now() });
  await recordAdminAudit({
    action: "users.note.delete",
    adminId: actor.adminId,
    module: "users",
    oldValues: { body: note.body, note: notePublicId },
    request: actor.request,
    subject: { id: user.id, type: AUDIT_SUBJECT },
  });
}
