import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";
import {
  mapAdminNotification,
  mapNotification,
} from "@/server/modules/notifications/notification.mapper";
import {
  countUnreadUserNotifications,
  createNotificationWithDeliveries,
  findAdminsByPublicIds,
  findExistingNotificationByEvent,
  findNotificationByPublicId,
  findUserNotificationByPublicId,
  findUsersByPublicIds,
  listAdminNotifications,
  listUserNotifications,
  markAllNotificationsReadUntil,
  markNotificationRead,
} from "@/server/modules/notifications/notification.repository";
import { buildAdminBroadcastNotification } from "@/server/modules/notifications/notification.templates";
import { sanitizeNotificationDeepLink } from "@/server/modules/notifications/notification.deeplink";
import {
  ADMIN_NOTIFICATION_RATE_LIMIT,
  MAX_ADMIN_NOTIFICATION_RECIPIENTS,
  type NotificationChannel,
  type NotificationType,
} from "@/server/modules/notifications/notification.types";

export async function enqueueDomainNotification(input: {
  adminId?: bigint | null;
  body: string;
  channels?: NotificationChannel[];
  data: { eventKey: string; deepLink?: string; requestId?: string; v: number };
  relatedServiceRequestId?: bigint | null;
  title: string;
  transaction?: Parameters<typeof createNotificationWithDeliveries>[0];
  type: NotificationType | string;
  userId?: bigint | null;
}) {
  const existing = await findExistingNotificationByEvent({
    adminId: input.adminId ?? null,
    eventKey: input.data.eventKey,
    type: input.type,
    userId: input.userId ?? null,
  });
  if (existing) {
    return { created: false as const, notificationId: existing.publicId };
  }

  const create = async (
    transaction: Parameters<typeof createNotificationWithDeliveries>[0],
  ) => {
    try {
      const created = await createNotificationWithDeliveries(transaction, {
        adminId: input.adminId ?? null,
        body: input.body,
        channels: input.channels,
        data: {
          ...input.data,
          deepLink: sanitizeNotificationDeepLink(input.data.deepLink),
        },
        publicId: createPublicId(),
        relatedServiceRequestId: input.relatedServiceRequestId ?? null,
        title: input.title,
        type: input.type,
        userId: input.userId ?? null,
      });
      return { created: true as const, notificationId: created.publicId };
    } catch (error) {
      // Unique channel race: treat as idempotent success when possible.
      const again = await findExistingNotificationByEvent({
        adminId: input.adminId ?? null,
        eventKey: input.data.eventKey,
        type: input.type,
        userId: input.userId ?? null,
      });
      if (again) {
        return { created: false as const, notificationId: again.publicId };
      }
      throw (
        mapPrismaError(error) ??
        new ApiError(
          500,
          API_ERROR_CODES.internalServerError,
          "ثبت اعلان ناموفق بود.",
          { cause: error },
        )
      );
    }
  };

  if (input.transaction) {
    return create(input.transaction);
  }

  return runInTransaction((transaction) => create(transaction));
}

export async function listCurrentUserNotifications(
  userId: bigint,
  query: {
    cursor?: string;
    limit: number;
    readStatus: "all" | "read" | "unread";
  },
) {
  let cursorId: bigint | undefined;
  if (query.cursor) {
    const cursor = await findUserNotificationByPublicId(userId, query.cursor);
    if (!cursor) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursor.id;
  }

  const rows = await listUserNotifications({
    cursorId,
    limit: query.limit,
    readStatus: query.readStatus,
    userId,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((item) =>
      mapNotification({
        ...item,
        relatedRequestPublicId: item.serviceRequest?.publicId ?? null,
      }),
    ),
    meta: {
      hasMore,
      limit: query.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function getCurrentUserUnreadNotificationCount(userId: bigint) {
  const count = await countUnreadUserNotifications(userId);
  return { unreadCount: count };
}

export async function markCurrentUserNotificationRead(
  userId: bigint,
  notificationId: string,
) {
  const notification = await findUserNotificationByPublicId(
    userId,
    notificationId,
  );
  if (!notification) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "اعلان یافت نشد.");
  }

  const newlyRead = await markNotificationRead(
    notification.id,
    systemClock.now(),
  );
  return {
    newlyRead,
    notificationId: notification.publicId,
    read: true,
  };
}

export async function markCurrentUserNotificationsReadAll(
  userId: bigint,
  untilIso: string,
) {
  const until = new Date(untilIso);
  if (Number.isNaN(until.getTime())) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "زمان until معتبر نیست.",
    );
  }

  const updated = await markAllNotificationsReadUntil({
    now: systemClock.now(),
    until,
    userId,
  });
  return { updated };
}

export async function sendAdminNotifications(input: {
  adminId: bigint;
  adminIds?: string[];
  body: string;
  channels: NotificationChannel[];
  deepLink?: string | null;
  title: string;
  type: NotificationType | string;
  userIds?: string[];
}) {
  await getAppRateLimiter().consume(`admin-notifications:${input.adminId.toString()}`, {
    limit: ADMIN_NOTIFICATION_RATE_LIMIT.limit,
    windowMilliseconds: ADMIN_NOTIFICATION_RATE_LIMIT.windowMs,
  });

  const userIds = [...new Set(input.userIds ?? [])];
  const adminIds = [...new Set(input.adminIds ?? [])];
  if (userIds.length + adminIds.length > MAX_ADMIN_NOTIFICATION_RECIPIENTS) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      `حداکثر ${MAX_ADMIN_NOTIFICATION_RECIPIENTS} گیرنده مجاز است.`,
    );
  }

  const [users, admins] = await Promise.all([
    userIds.length > 0 ? findUsersByPublicIds(userIds) : Promise.resolve([]),
    adminIds.length > 0 ? findAdminsByPublicIds(adminIds) : Promise.resolve([]),
  ]);

  if (users.length !== userIds.length || admins.length !== adminIds.length) {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "یکی از گیرنده‌ها یافت نشد.",
    );
  }

  const batchKey = createPublicId();
  const createdIds: string[] = [];

  for (const user of users) {
    const template = buildAdminBroadcastNotification({
      body: input.body,
      deepLink: input.deepLink,
      eventKey: `${input.type}:admin:${batchKey}:user:${user.publicId}`,
      title: input.title,
    });
    const result = await enqueueDomainNotification({
      body: template.body,
      channels: input.channels,
      data: template.data,
      title: template.title,
      type: input.type,
      userId: user.id,
    });
    createdIds.push(result.notificationId);
  }

  for (const admin of admins) {
    const template = buildAdminBroadcastNotification({
      body: input.body,
      deepLink: input.deepLink,
      eventKey: `${input.type}:admin:${batchKey}:admin:${admin.publicId}`,
      title: input.title,
    });
    const result = await enqueueDomainNotification({
      adminId: admin.id,
      body: template.body,
      channels: input.channels,
      data: template.data,
      title: template.title,
      type: input.type,
    });
    createdIds.push(result.notificationId);
  }

  return {
    batchKey,
    createdCount: createdIds.length,
    notificationIds: createdIds,
  };
}

export async function listAdminManagedNotifications(query: {
  cursor?: string;
  limit: number;
  recipientType?: "user" | "admin";
  type?: string;
}) {
  let cursorId: bigint | undefined;
  if (query.cursor) {
    const cursor = await findNotificationByPublicId(query.cursor);
    if (!cursor) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursor.id;
  }

  const rows = await listAdminNotifications({
    cursorId,
    limit: query.limit,
    recipientType: query.recipientType,
    type: query.type,
  });
  const hasMore = rows.length > query.limit;
  const page = hasMore ? rows.slice(0, query.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map((item) =>
      mapAdminNotification({
        adminPublicId: item.admin?.publicId ?? null,
        body: item.body,
        createdAt: item.createdAt,
        data: item.data,
        deliveries: item.notificationDeliveries,
        publicId: item.publicId,
        readAt: item.readAt,
        recipientType: item.recipientType,
        title: item.title,
        type: item.type,
        userPublicId: item.user?.publicId ?? null,
      }),
    ),
    meta: {
      hasMore,
      limit: query.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}
