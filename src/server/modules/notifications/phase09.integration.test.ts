import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { runNotificationDeliveryJob } from "@/server/modules/notifications/notification.delivery";
import {
  enqueueDomainNotification,
  getCurrentUserUnreadNotificationCount,
  listCurrentUserNotifications,
  markCurrentUserNotificationRead,
  markCurrentUserNotificationsReadAll,
  sendAdminNotifications,
} from "@/server/modules/notifications/notification.service";
import { buildRequestNotification } from "@/server/modules/notifications/notification.templates";
import { NOTIFICATION_TYPES } from "@/server/modules/notifications/notification.types";
import { sanitizeNotificationDeepLink } from "@/server/modules/notifications/notification.deeplink";

const phones = ["09997000001", "09997000002", "09997000003"];
const adminPhone = "09997000999";

async function createUser(phone: string, name: string) {
  return prisma.user.create({
    data: { name, phone, publicId: createPublicId() },
  });
}

async function cleanup() {
  await prisma.notificationDelivery.deleteMany({
    where: {
      OR: [
        { notification: { user: { phone: { in: phones } } } },
        { notification: { admin: { phone: adminPhone } } },
      ],
    },
  });
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { user: { phone: { in: phones } } },
        { admin: { phone: adminPhone } },
      ],
    },
  });
  await prisma.adminAuditLog.deleteMany({
    where: { admin: { phone: adminPhone } },
  });
  await prisma.admin.deleteMany({ where: { phone: adminPhone } });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("phase 09 notifications", () => {
  beforeAll(async () => {
    await cleanup();
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("sanitizes deep-link allow-list", () => {
    const requestId = createPublicId();
    expect(sanitizeNotificationDeepLink(`/users/requests/${requestId}`)).toBe(
      `/users/requests/${requestId}`,
    );
    expect(sanitizeNotificationDeepLink("https://evil.example/x")).toBeUndefined();
    expect(sanitizeNotificationDeepLink("/admin/secret")).toBeUndefined();
  });

  it("lists unread, marks read, and supports read-all until", async () => {
    const user = await createUser(phones[0]!, "n9-user-a");
    const other = await createUser(phones[1]!, "n9-user-b");
    const requestId = createPublicId();

    const first = buildRequestNotification({
      body: "اعلان اول",
      requestId,
      title: "عنوان ۱",
      type: NOTIFICATION_TYPES.requestNew,
      viewer: "provider",
    });
    await enqueueDomainNotification({
      body: first.body,
      data: first.data,
      title: first.title,
      type: first.type,
      userId: user.id,
    });

    const second = buildRequestNotification({
      body: "اعلان دوم",
      requestId: createPublicId(),
      title: "عنوان ۲",
      type: NOTIFICATION_TYPES.requestAccepted,
      viewer: "consumer",
    });
    await enqueueDomainNotification({
      body: second.body,
      data: second.data,
      title: second.title,
      type: second.type,
      userId: user.id,
    });

    await enqueueDomainNotification({
      body: "برای کاربر دیگر",
      data: {
        eventKey: `admin_broadcast:other:${createPublicId()}`,
        v: 1,
      },
      title: "خصوصی",
      type: NOTIFICATION_TYPES.adminBroadcast,
      userId: other.id,
    });

    const unread = await getCurrentUserUnreadNotificationCount(user.id);
    expect(unread.unreadCount).toBe(2);

    const listed = await listCurrentUserNotifications(user.id, {
      limit: 20,
      readStatus: "unread",
    });
    expect(listed.items).toHaveLength(2);
    expect(
      listed.items.every((item) => item.notificationId !== undefined),
    ).toBe(true);

    const firstId = listed.items[0]!.notificationId;
    const marked = await markCurrentUserNotificationRead(user.id, firstId);
    expect(marked.newlyRead).toBe(true);
    expect(marked.read).toBe(true);

    await expect(
      markCurrentUserNotificationRead(user.id, listed.items[0]!.notificationId),
    ).resolves.toMatchObject({ newlyRead: false, read: true });

    await expect(
      markCurrentUserNotificationRead(other.id, firstId),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });

    const until = new Date(Date.now() + 1000).toISOString();
    const readAll = await markCurrentUserNotificationsReadAll(user.id, until);
    expect(readAll.updated).toBeGreaterThanOrEqual(1);

    const after = await getCurrentUserUnreadNotificationCount(user.id);
    expect(after.unreadCount).toBe(0);
  });

  it("is idempotent per event/channel and delivers in-app async", async () => {
    const user = await createUser(phones[2]!, "n9-user-c");
    const requestId = createPublicId();
    const template = buildRequestNotification({
      body: "idempotent body",
      requestId,
      title: "idempotent",
      type: NOTIFICATION_TYPES.requestCompleted,
      viewer: "provider",
    });

    const first = await enqueueDomainNotification({
      body: template.body,
      channels: ["in_app", "sms"],
      data: template.data,
      title: template.title,
      type: template.type,
      userId: user.id,
    });
    const second = await enqueueDomainNotification({
      body: template.body,
      channels: ["in_app", "sms"],
      data: template.data,
      title: template.title,
      type: template.type,
      userId: user.id,
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.notificationId).toBe(first.notificationId);

    const notification = await prisma.notification.findUniqueOrThrow({
      where: { publicId: first.notificationId },
      include: { notificationDeliveries: true },
    });
    expect(notification.notificationDeliveries).toHaveLength(2);
    expect(
      notification.notificationDeliveries.every((d) => d.status === "queued"),
    ).toBe(true);

    const result = await runNotificationDeliveryJob(20);
    expect(result.delivered).toBeGreaterThanOrEqual(1);
    expect(result.skipped).toBeGreaterThanOrEqual(1);

    const after = await prisma.notificationDelivery.findMany({
      where: { notificationId: notification.id },
    });
    const byChannel = Object.fromEntries(
      after.map((row) => [row.channel, row.status]),
    );
    expect(byChannel.in_app).toBe("delivered");
    expect(byChannel.sms).toBe("skipped");
  });

  it("allows admin targeted send with batch recipients", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { phone: phones[0]! },
    });
    const admin = await prisma.admin.create({
      data: {
        isSuperAdmin: 1,
        name: "n9-admin",
        password: "x".repeat(60),
        phone: adminPhone,
        publicId: createPublicId(),
      },
    });

    const sent = await sendAdminNotifications({
      adminId: admin.id,
      body: "پیام مدیریتی",
      channels: ["in_app"],
      deepLink: "/users/search",
      title: "اعلان ادمین",
      type: NOTIFICATION_TYPES.adminBroadcast,
      userIds: [user.publicId],
    });

    expect(sent.createdCount).toBe(1);
    expect(sent.notificationIds).toHaveLength(1);

    const listed = await listCurrentUserNotifications(user.id, {
      limit: 50,
      readStatus: "all",
    });
    expect(
      listed.items.some((item) => item.type === NOTIFICATION_TYPES.adminBroadcast),
    ).toBe(true);

    await expect(
      sendAdminNotifications({
        adminId: admin.id,
        body: "بدون گیرنده",
        channels: ["in_app"],
        title: "bad",
        type: NOTIFICATION_TYPES.adminBroadcast,
        userIds: [createPublicId()],
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("marks exhausted failures as dead-letter observable", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { phone: phones[0]! },
    });
    const created = await enqueueDomainNotification({
      body: "dead letter candidate",
      channels: ["in_app"],
      data: {
        eventKey: `admin_broadcast:dead:${createPublicId()}`,
        v: 1,
      },
      title: "dead",
      type: NOTIFICATION_TYPES.adminBroadcast,
      userId: user.id,
    });

    const notification = await prisma.notification.findUniqueOrThrow({
      where: { publicId: created.notificationId },
      include: { notificationDeliveries: true },
    });
    const delivery = notification.notificationDeliveries[0]!;

    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        attemptsCount: 5,
        errorMessage: "simulated_failure",
        failedAt: new Date(),
        status: "failed",
      },
    });

    const job = await runNotificationDeliveryJob(50);
    expect(job.deadLetterCount).toBeGreaterThanOrEqual(1);
  });
});
