import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";
import type { NotificationChannel } from "@/server/modules/notifications/notification.types";
import { MAX_DELIVERY_ATTEMPTS } from "@/server/modules/notifications/notification.types";

export async function findExistingNotificationByEvent(input: {
  adminId?: bigint | null;
  eventKey: string;
  type: string;
  userId?: bigint | null;
}) {
  const candidates = await prisma.notification.findMany({
    where: {
      type: input.type,
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.adminId ? { adminId: input.adminId } : {}),
    },
    orderBy: { id: "desc" },
    take: 20,
    select: {
      data: true,
      id: true,
      publicId: true,
    },
  });

  return (
    candidates.find((item) => {
      if (!item.data || typeof item.data !== "object" || Array.isArray(item.data)) {
        return false;
      }
      return (item.data as { eventKey?: unknown }).eventKey === input.eventKey;
    }) ?? null
  );
}

export async function createNotificationWithDeliveries(
  transaction: TransactionClient,
  input: {
    adminId?: bigint | null;
    body: string;
    channels?: NotificationChannel[];
    data?: unknown;
    publicId: string;
    relatedServiceRequestId?: bigint | null;
    title: string;
    type: string;
    userId?: bigint | null;
  },
) {
  const notification = await transaction.notification.create({
    data: {
      adminId: input.adminId ?? null,
      body: input.body,
      data: input.data ?? undefined,
      publicId: input.publicId,
      recipientType: input.adminId ? "admin" : "user",
      relatedServiceRequestId: input.relatedServiceRequestId ?? null,
      title: input.title,
      type: input.type,
      userId: input.userId ?? null,
    },
    select: { id: true, publicId: true },
  });

  const channels = input.channels ?? ["in_app"];
  for (const channel of channels) {
    await transaction.notificationDelivery.create({
      data: {
        channel,
        notificationId: notification.id,
        status: "queued",
      },
    });
  }

  return notification;
}

export async function listUserNotifications(input: {
  cursorId?: bigint;
  limit: number;
  readStatus: "all" | "read" | "unread";
  userId: bigint;
}) {
  return prisma.notification.findMany({
    where: {
      userId: input.userId,
      ...(input.readStatus === "read" ? { readAt: { not: null } } : {}),
      ...(input.readStatus === "unread" ? { readAt: null } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      body: true,
      createdAt: true,
      data: true,
      id: true,
      publicId: true,
      readAt: true,
      title: true,
      type: true,
      serviceRequest: { select: { publicId: true } },
    },
  });
}

export async function countUnreadUserNotifications(userId: bigint) {
  return prisma.notification.count({
    where: { readAt: null, userId },
  });
}

export async function findUserNotificationByPublicId(
  userId: bigint,
  publicId: string,
) {
  return prisma.notification.findFirst({
    where: { publicId, userId },
    select: {
      id: true,
      publicId: true,
      readAt: true,
    },
  });
}

export async function markNotificationRead(
  notificationId: bigint,
  now: Date,
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, readAt: null },
    data: { readAt: now },
  });
  return result.count > 0;
}

export async function markAllNotificationsReadUntil(input: {
  until: Date;
  userId: bigint;
  now: Date;
}) {
  const result = await prisma.notification.updateMany({
    where: {
      createdAt: { lte: input.until },
      readAt: null,
      userId: input.userId,
    },
    data: { readAt: input.now },
  });
  return result.count;
}

export async function findUsersByPublicIds(publicIds: string[]) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      isActive: 1,
      publicId: { in: publicIds },
    },
    select: { id: true, publicId: true },
  });
}

export async function findAdminsByPublicIds(publicIds: string[]) {
  return prisma.admin.findMany({
    where: {
      deletedAt: null,
      isActive: 1,
      publicId: { in: publicIds },
    },
    select: { id: true, publicId: true },
  });
}

export async function listAdminNotifications(input: {
  cursorId?: bigint;
  limit: number;
  recipientType?: "user" | "admin";
  type?: string;
}) {
  return prisma.notification.findMany({
    where: {
      ...(input.recipientType ? { recipientType: input.recipientType } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      body: true,
      createdAt: true,
      data: true,
      id: true,
      publicId: true,
      readAt: true,
      recipientType: true,
      title: true,
      type: true,
      admin: { select: { publicId: true } },
      user: { select: { publicId: true } },
      notificationDeliveries: {
        select: {
          attemptsCount: true,
          channel: true,
          errorMessage: true,
          status: true,
        },
      },
    },
  });
}

export async function findNotificationByPublicId(publicId: string) {
  return prisma.notification.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function listQueuedDeliveries(limit: number) {
  return prisma.notificationDelivery.findMany({
    where: {
      OR: [
        { status: "queued" },
        {
          attemptsCount: { lt: MAX_DELIVERY_ATTEMPTS },
          status: "failed",
        },
      ],
    },
    orderBy: [{ queuedAt: "asc" }, { id: "asc" }],
    take: limit,
    select: {
      attemptsCount: true,
      channel: true,
      id: true,
      notificationId: true,
      status: true,
      updatedAt: true,
      notification: {
        select: {
          body: true,
          publicId: true,
          title: true,
          type: true,
          userId: true,
          adminId: true,
        },
      },
    },
  });
}

export async function markDeliveryProcessing(
  deliveryId: bigint,
  attemptsCount: number,
) {
  return prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      attemptsCount,
      updatedAt: new Date(),
    },
  });
}

export async function markDeliverySucceeded(
  deliveryId: bigint,
  now: Date,
  providerMessageId?: string,
) {
  return prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      deliveredAt: now,
      provider: "internal",
      providerMessageId: providerMessageId ?? null,
      sentAt: now,
      status: "delivered",
      updatedAt: now,
      errorMessage: null,
    },
  });
}

export async function markDeliverySkipped(deliveryId: bigint, now: Date, reason: string) {
  return prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      errorMessage: reason.slice(0, 1500),
      status: "skipped",
      updatedAt: now,
    },
  });
}

export async function markDeliveryFailed(
  deliveryId: bigint,
  now: Date,
  errorMessage: string,
  attemptsCount: number,
) {
  const dead = attemptsCount >= MAX_DELIVERY_ATTEMPTS;
  return prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      attemptsCount,
      errorMessage: errorMessage.slice(0, 1500),
      failedAt: dead ? now : null,
      status: "failed",
      updatedAt: now,
    },
  });
}

export async function listDeadLetterDeliveries(limit = 100) {
  return prisma.notificationDelivery.findMany({
    where: {
      attemptsCount: { gte: MAX_DELIVERY_ATTEMPTS },
      status: "failed",
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
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
        },
      },
      updatedAt: true,
    },
  });
}

export async function requeueDeadLetterDelivery(deliveryId: bigint) {
  return prisma.notificationDelivery.updateMany({
    where: {
      attemptsCount: { gte: MAX_DELIVERY_ATTEMPTS },
      id: deliveryId,
      status: "failed",
    },
    data: {
      attemptsCount: 0,
      errorMessage: null,
      failedAt: null,
      status: "queued",
      updatedAt: new Date(),
    },
  });
}
