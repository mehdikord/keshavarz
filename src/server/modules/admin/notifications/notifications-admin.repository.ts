import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type {
  AudienceInput,
  DeliveriesQuery,
  NotificationsQuery,
} from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { activeSubscriptionWhere } from "@/server/modules/admin/providers/providers-admin.repository";
import { MAX_DELIVERY_ATTEMPTS, NOTIFICATION_TYPES } from "@/server/modules/notifications/notification.types";

export const BROADCAST_TYPE = NOTIFICATION_TYPES.adminBroadcast;
export const BROADCAST_AUDIT_ACTION = "notifications.broadcast";

// ------------------------------------------------------------------ audience

/**
 * Who receives a broadcast. Deleted and deactivated accounts never do; the
 * provider segments mirror the providers section (and the app's search).
 */
export function audienceWhere(audience: AudienceInput, now: Date): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = { deletedAt: null, isActive: 1 };
  switch (audience.kind) {
    case "user":
      return { ...base, publicId: audience.userId };
    case "consumers":
      return { ...base, providerProfile: { is: null } };
    case "providers":
      return { ...base, providerProfile: { isNot: null } };
    case "eligible_providers":
      return {
        ...base,
        providerProfile: {
          is: {
            isActive: 1,
            isAvailable: 1,
            providerServices: { some: { isActive: 1 } },
            providerSubscriptions: { some: activeSubscriptionWhere(now) },
            workLatitude: { not: null },
            workLongitude: { not: null },
          },
        },
      };
    case "providers_without_subscription":
      return {
        ...base,
        providerProfile: { is: { isActive: 1, providerSubscriptions: { none: activeSubscriptionWhere(now) } } },
      };
    case "province":
      return { ...base, provinceId: BigInt(audience.provinceId ?? 0) };
    default:
      return base;
  }
}

export async function countAudience(where: Prisma.UserWhereInput) {
  return prisma.user.count({ where });
}

export async function sampleAudience(where: Prisma.UserWhereInput, take: number) {
  return prisma.user.findMany({
    orderBy: { id: "desc" },
    select: { name: true, phone: true, publicId: true },
    take,
    where,
  });
}

/** Keyset page over the audience, so a large send never loads every row at once. */
export async function listAudienceChunk(where: Prisma.UserWhereInput, afterId: bigint, take: number) {
  return prisma.user.findMany({
    orderBy: { id: "asc" },
    select: { id: true, publicId: true },
    take,
    where: { AND: [where, { id: { gt: afterId } }] },
  });
}

export async function findUserBrief(publicId: string) {
  return prisma.user.findUnique({
    select: { deletedAt: true, isActive: true, name: true, phone: true, publicId: true },
    where: { publicId },
  });
}

export async function findProvinceName(id: number) {
  const row = await prisma.province.findUnique({ select: { name: true }, where: { id: BigInt(id) } });
  return row?.name ?? null;
}

export async function searchRecipients(q: string) {
  const digits = q.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)).replace(/\D/g, "");
  const or: Prisma.UserWhereInput[] = [{ name: { contains: q } }];
  if (digits.length >= 3) or.push({ phone: { contains: digits } });
  if (/^[0-9A-Za-z]{26}$/.test(q)) or.push({ publicId: q.toUpperCase() });
  return prisma.user.findMany({
    orderBy: { id: "desc" },
    select: {
      image: true,
      name: true,
      phone: true,
      providerProfile: { select: { id: true } },
      publicId: true,
    },
    take: 8,
    where: { deletedAt: null, isActive: 1, OR: or },
  });
}

/** One batch of a broadcast: notifications plus their queued in-app deliveries. */
export async function insertBroadcastChunk(
  transaction: TransactionClient,
  rows: Array<{ data: Prisma.InputJsonValue; publicId: string; userId: bigint }>,
  content: { body: string; title: string },
) {
  if (rows.length === 0) return 0;
  await transaction.notification.createMany({
    data: rows.map((row) => ({
      body: content.body,
      data: row.data,
      publicId: row.publicId,
      recipientType: "user" as const,
      title: content.title,
      type: BROADCAST_TYPE,
      userId: row.userId,
    })),
  });
  const created = await transaction.notification.findMany({
    select: { id: true },
    where: { publicId: { in: rows.map((row) => row.publicId) } },
  });
  await transaction.notificationDelivery.createMany({
    data: created.map((row) => ({ channel: "in_app" as const, notificationId: row.id, status: "queued" as const })),
  });
  return created.length;
}

// ----------------------------------------------------------------- campaigns

const campaignFilter = (campaignId: string): Prisma.NotificationWhereInput => ({
  data: { equals: campaignId, path: "$.campaignId" },
  type: BROADCAST_TYPE,
});

export async function listCampaignAudits(skip: number, take: number) {
  const where: Prisma.AdminAuditLogWhereInput = { action: BROADCAST_AUDIT_ACTION, module: "notifications" };
  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { id: "desc" },
      select: { admin: { select: { name: true, publicId: true } }, createdAt: true, id: true, metadata: true },
      skip,
      take,
      where,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);
  return { rows, total };
}

export async function findCampaignAudit(campaignId: string) {
  return prisma.adminAuditLog.findFirst({
    select: { admin: { select: { name: true, publicId: true } }, createdAt: true, id: true, metadata: true },
    where: {
      action: BROADCAST_AUDIT_ACTION,
      metadata: { equals: campaignId, path: "$.campaignId" },
      module: "notifications",
    },
  });
}

export interface CampaignStatsRow {
  delivered: number;
  failed: number;
  queued: number;
  read: number;
  skipped: number;
  total: number;
}

export async function campaignStats(campaignIds: string[]): Promise<Map<string, CampaignStatsRow>> {
  const stats = new Map<string, CampaignStatsRow>();
  if (campaignIds.length === 0) return stats;
  const [totals, deliveries] = await Promise.all([
    prisma.$queryRaw<Array<{ campaign_id: string; read_count: bigint | number; total: bigint | number }>>`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(n.data, '$.campaignId')) AS campaign_id,
             COUNT(*) AS total,
             SUM(n.read_at IS NOT NULL) AS read_count
      FROM notifications n
      WHERE n.type = ${BROADCAST_TYPE}
        AND JSON_UNQUOTE(JSON_EXTRACT(n.data, '$.campaignId')) IN (${Prisma.join(campaignIds)})
      GROUP BY campaign_id`,
    prisma.$queryRaw<Array<{ campaign_id: string; status: string; total: bigint | number }>>`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(n.data, '$.campaignId')) AS campaign_id, d.status AS status, COUNT(*) AS total
      FROM notifications n
      JOIN notification_deliveries d ON d.notification_id = n.id
      WHERE n.type = ${BROADCAST_TYPE}
        AND JSON_UNQUOTE(JSON_EXTRACT(n.data, '$.campaignId')) IN (${Prisma.join(campaignIds)})
      GROUP BY campaign_id, d.status`,
  ]);
  for (const id of campaignIds) stats.set(id, { delivered: 0, failed: 0, queued: 0, read: 0, skipped: 0, total: 0 });
  for (const row of totals) {
    const entry = stats.get(row.campaign_id);
    if (!entry) continue;
    entry.total = Number(row.total);
    entry.read = Number(row.read_count ?? 0);
  }
  for (const row of deliveries) {
    const entry = stats.get(row.campaign_id);
    if (!entry) continue;
    const count = Number(row.total);
    if (row.status === "delivered" || row.status === "sent") entry.delivered += count;
    else if (row.status === "failed") entry.failed += count;
    else if (row.status === "skipped") entry.skipped += count;
    else entry.queued += count;
  }
  return stats;
}

export async function listCampaignRecipients(campaignId: string, read: "all" | "read" | "unread", skip: number, take: number) {
  const where: Prisma.NotificationWhereInput = {
    ...campaignFilter(campaignId),
    ...(read === "read" ? { readAt: { not: null } } : read === "unread" ? { readAt: null } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { id: "asc" },
      select: {
        createdAt: true,
        notificationDeliveries: { select: { channel: true, errorMessage: true, id: true, status: true } },
        publicId: true,
        readAt: true,
        user: { select: { image: true, name: true, phone: true, publicId: true } },
      },
      skip,
      take,
      where,
    }),
    prisma.notification.count({ where }),
  ]);
  return { rows, total };
}

// ---------------------------------------------------------------- explorer

function periodStart(period: NotificationsQuery["period"], now: Date): Date | null {
  const day = 86_400_000;
  switch (period) {
    case "today": {
      // Tehran midnight is close enough for an "today" filter on an admin list.
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * day);
    case "30d":
      return new Date(now.getTime() - 30 * day);
    case "90d":
      return new Date(now.getTime() - 90 * day);
    default:
      return null;
  }
}

function explorerWhere(query: NotificationsQuery, now: Date): Prisma.NotificationWhereInput {
  const and: Prisma.NotificationWhereInput[] = [];
  if (query.type) and.push({ type: query.type });
  if (query.recipient !== "all") and.push({ recipientType: query.recipient });
  if (query.read === "read") and.push({ readAt: { not: null } });
  if (query.read === "unread") and.push({ readAt: null });
  const since = periodStart(query.period, now);
  if (since) and.push({ createdAt: { gte: since } });
  const q = query.q?.trim();
  if (q) {
    const digits = q.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)).replace(/\D/g, "");
    const or: Prisma.NotificationWhereInput[] = [
      { title: { contains: q } },
      { user: { name: { contains: q } } },
      { admin: { name: { contains: q } } },
    ];
    if (digits.length >= 3) or.push({ user: { phone: { contains: digits } } });
    if (/^[0-9A-Za-z]{26}$/.test(q)) {
      const id = q.toUpperCase();
      or.push({ publicId: id }, { user: { publicId: id } }, { serviceRequest: { publicId: id } });
    }
    and.push({ OR: or });
  }
  return and.length ? { AND: and } : {};
}

export async function listNotificationRows(query: NotificationsQuery, now: Date) {
  const where = explorerWhere(query, now);
  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { id: "desc" },
      select: {
        admin: { select: { name: true } },
        body: true,
        createdAt: true,
        data: true,
        notificationDeliveries: { select: { attemptsCount: true, channel: true, errorMessage: true, id: true, status: true } },
        publicId: true,
        readAt: true,
        recipientType: true,
        serviceRequest: { select: { publicId: true } },
        title: true,
        type: true,
        user: { select: { image: true, name: true, phone: true, publicId: true } },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.notification.count({ where }),
  ]);
  return { rows, total };
}

export async function countNotificationsPerType() {
  const rows = await prisma.notification.groupBy({ _count: { _all: true }, by: ["type"] });
  return rows.map((row) => ({ count: row._count._all, type: row.type })).sort((a, b) => b.count - a.count);
}

// --------------------------------------------------------------- deliveries

export async function deliveryCounts() {
  const [byStatus, dead, retrying, oldestQueued] = await Promise.all([
    prisma.notificationDelivery.groupBy({ _count: { _all: true }, by: ["channel", "status"] }),
    prisma.notificationDelivery.count({ where: { attemptsCount: { gte: MAX_DELIVERY_ATTEMPTS }, status: "failed" } }),
    prisma.notificationDelivery.count({ where: { attemptsCount: { lt: MAX_DELIVERY_ATTEMPTS }, status: "failed" } }),
    prisma.notificationDelivery.findFirst({
      orderBy: { queuedAt: "asc" },
      select: { queuedAt: true },
      where: { status: "queued" },
    }),
  ]);
  return {
    byStatus: byStatus.map((row) => ({ channel: row.channel, count: row._count._all, status: row.status })),
    dead,
    oldestQueuedAt: oldestQueued?.queuedAt ?? null,
    retrying,
  };
}

function deliveryWhere(query: DeliveriesQuery): Prisma.NotificationDeliveryWhereInput {
  const channel = query.channel === "all" ? {} : { channel: query.channel };
  switch (query.status) {
    case "problem":
      return { ...channel, status: "failed" };
    case "dead":
      return { ...channel, attemptsCount: { gte: MAX_DELIVERY_ATTEMPTS }, status: "failed" };
    case "retrying":
      return { ...channel, attemptsCount: { lt: MAX_DELIVERY_ATTEMPTS }, status: "failed" };
    case "queued":
      return { ...channel, status: "queued" };
    case "skipped":
      return { ...channel, status: "skipped" };
    case "delivered":
      return { ...channel, status: { in: ["delivered", "sent"] } };
    default:
      return channel;
  }
}

export async function listDeliveryRows(query: DeliveriesQuery, take: number) {
  const where = deliveryWhere(query);
  const [rows, total] = await Promise.all([
    prisma.notificationDelivery.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        attemptsCount: true,
        channel: true,
        errorMessage: true,
        failedAt: true,
        id: true,
        notification: {
          select: {
            publicId: true,
            title: true,
            type: true,
            user: { select: { name: true, phone: true, publicId: true } },
          },
        },
        queuedAt: true,
        status: true,
        updatedAt: true,
      },
      skip: (query.page - 1) * take,
      take,
      where,
    }),
    prisma.notificationDelivery.count({ where }),
  ]);
  return { rows, total };
}

export async function findDelivery(id: bigint) {
  return prisma.notificationDelivery.findUnique({
    select: { attemptsCount: true, channel: true, errorMessage: true, id: true, status: true },
    where: { id },
  });
}

/** Puts a failed delivery back at the head of the queue with a fresh retry budget. */
export async function requeueDelivery(transaction: TransactionClient, id: bigint, now: Date) {
  const result = await transaction.notificationDelivery.updateMany({
    data: { attemptsCount: 0, errorMessage: null, failedAt: null, status: "queued", updatedAt: now },
    where: { id, status: "failed" },
  });
  return result.count;
}

export async function requeueDeadDeliveries(transaction: TransactionClient, now: Date) {
  const result = await transaction.notificationDelivery.updateMany({
    data: { attemptsCount: 0, errorMessage: null, failedAt: null, status: "queued", updatedAt: now },
    where: { attemptsCount: { gte: MAX_DELIVERY_ATTEMPTS }, status: "failed" },
  });
  return result.count;
}
