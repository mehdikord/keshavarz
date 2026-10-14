import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { runJobs } from "@/server/jobs/runner";
import { getCurrentUserLand } from "@/server/modules/lands/lands.service";
import {
  enqueueDomainNotification,
  markCurrentUserNotificationRead,
} from "@/server/modules/notifications/notification.service";
import { NOTIFICATION_TYPES } from "@/server/modules/notifications/notification.types";
import {
  getOpsMetricsForAdmin,
  listPaymentDeadLettersForAdmin,
  replayPaymentDeadLetterForAdmin,
} from "@/server/modules/ops/ops.service";
import {
  clearPaymentCallbackDeadLettersForTests,
  enqueuePaymentCallbackDeadLetter,
  listPaymentCallbackDeadLetters,
} from "@/server/modules/payments/payment-dead-letter";
import {
  getMetricsSnapshot,
  incrementMetric,
  resetMetricsForTests,
} from "@/server/observability/metrics";

const phones = ["09999100001", "09999100002"];

async function cleanup() {
  clearPaymentCallbackDeadLettersForTests();
  resetMetricsForTests();
  await prisma.notificationDelivery.deleteMany({
    where: { notification: { user: { phone: { in: phones } } } },
  });
  await prisma.notification.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.land.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("phase 12-13 ops and idor", () => {
  let ownerId: bigint;
  let otherId: bigint;
  let landPublicId: string;
  let notificationPublicId: string;

  beforeAll(async () => {
    await cleanup();
    const owner = await prisma.user.create({
      data: {
        name: "idor owner",
        phone: phones[0]!,
        publicId: createPublicId(),
      },
    });
    const other = await prisma.user.create({
      data: {
        name: "idor other",
        phone: phones[1]!,
        publicId: createPublicId(),
      },
    });
    ownerId = owner.id;
    otherId = other.id;

    const land = await prisma.land.create({
      data: {
        areaSquareMeters: "1200",
        latitude: "35.7000000",
        longitude: "51.4000000",
        publicId: createPublicId(),
        title: "زمین IDOR",
        userId: owner.id,
      },
    });
    landPublicId = land.publicId;

    const created = await enqueueDomainNotification({
      body: "خصوصی",
      data: { eventKey: `admin_broadcast:idor:${createPublicId()}`, v: 1 },
      title: "اعلان خصوصی",
      type: NOTIFICATION_TYPES.adminBroadcast,
      userId: owner.id,
    });
    notificationPublicId = created.notificationId;
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("records metrics and exposes snapshot", async () => {
    incrementMetric("http_requests_total", {
      realm: "app",
      status_class: "2xx",
    });
    const snapshot = getMetricsSnapshot();
    expect(
      snapshot["http_requests_total{realm=app,status_class=2xx}"],
    ).toBeGreaterThanOrEqual(1);

    const ops = await getOpsMetricsForAdmin();
    expect(ops.metrics).toBeTruthy();
    expect(ops.scrapedAt).toBeTruthy();
  });

  it("lists and replays payment dead-letters", async () => {
    enqueuePaymentCallbackDeadLetter({
      error: "callback_failed",
      payload: {
        amountToman: 1000,
        authority: "bad",
        gateway: "mock",
        signature: "x",
      },
    });

    const listed = await listPaymentDeadLettersForAdmin();
    expect(listed.items.length).toBeGreaterThanOrEqual(1);
    const id = listed.items[0]!.id;

    const replayed = await replayPaymentDeadLetterForAdmin(id);
    expect(["replayed", "requeued", "dropped"]).toContain(replayed.status);
    expect(
      listPaymentCallbackDeadLetters().some((entry) => entry.id === id),
    ).toBe(replayed.status === "requeued");
  });

  it("runs unified job runner for rbac-expiry and export-cleanup", async () => {
    const result = await runJobs(["rbac-expiry", "export-cleanup"]);
    expect(result.jobs["rbac-expiry"]).toMatchObject({ ok: true });
    expect(result.jobs["export-cleanup"]).toMatchObject({ ok: true });
  });

  it("blocks cross-user land access", async () => {
    await expect(getCurrentUserLand(ownerId, landPublicId)).resolves.toBeTruthy();
    await expect(
      getCurrentUserLand(otherId, landPublicId),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("blocks cross-user notification read", async () => {
    await expect(
      markCurrentUserNotificationRead(ownerId, notificationPublicId),
    ).resolves.toMatchObject({ read: true });
    await expect(
      markCurrentUserNotificationRead(otherId, notificationPublicId),
    ).rejects.toMatchObject({ status: 404 });
  });
});
