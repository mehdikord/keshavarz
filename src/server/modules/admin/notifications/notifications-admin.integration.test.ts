import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { BroadcastSchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import {
  getCampaign,
  getDeliveryHealth,
  listCampaigns,
  listNotifications,
  previewAudience,
  replayDeadDeliveries,
  replayDelivery,
  sendBroadcast,
} from "@/server/modules/admin/notifications/notifications-admin.service";

const ADMIN_PHONE = "09996600001";
const PHONES = ["09996600011", "09996600012", "09996600013", "09996600014"];
const PROVINCE_NAME = "استان آزمون اعلان";

const request = new NextRequest("http://localhost/api/admins/v1/notifications/broadcasts", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.6" },
  method: "POST",
});

let actor: { adminId: bigint; request: NextRequest };
let provinceId: number;
let consumerIds: string[] = [];

async function cleanup() {
  const users = await prisma.user.findMany({ select: { id: true }, where: { phone: { in: PHONES } } });
  const userIds = users.map((row) => row.id);
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.providerProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.province.deleteMany({ where: { name: { startsWith: PROVINCE_NAME } } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
}

describe.sequential("admin notifications", () => {
  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر اعلان", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    actor = { adminId: admin.id, request };
    const province = await prisma.province.create({ data: { name: PROVINCE_NAME } });
    provinceId = Number(province.id);

    const [a, b, provider, deleted] = await Promise.all(
      PHONES.map((phone, index) =>
        prisma.user.create({
          data: {
            name: `گیرنده آزمون ${index + 1}`,
            phone,
            provinceId: province.id,
            publicId: createPublicId(),
            ...(index === 3 ? { deletedAt: new Date() } : {}),
          },
        }),
      ),
    );
    void deleted;
    await prisma.providerProfile.create({ data: { isActive: 1, userId: provider!.id } });
    consumerIds = [a!.publicId, b!.publicId];
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("counts a province segment without deleted accounts, and splits consumers from providers", async () => {
    const preview = await previewAudience({ kind: "province", provinceId });
    expect(preview.count).toBe(3);
    expect(preview.sample.map((user) => user.phone).sort()).toEqual(PHONES.slice(0, 3).sort());

    const consumers = await previewAudience({ kind: "consumers" });
    const providers = await previewAudience({ kind: "providers" });
    const all = await previewAudience({ kind: "all" });
    expect(consumers.count + providers.count).toBe(all.count);

    await expect(previewAudience({ kind: "user", userId: (await prisma.user.findFirstOrThrow({ where: { phone: PHONES[3] } })).publicId }))
      .rejects.toMatchObject({ status: 400 });
  });

  it("sends to one user and to a segment, grouped as campaigns", async () => {
    const single = await sendBroadcast(
      actor,
      BroadcastSchema.parse({
        audience: { kind: "user", userId: consumerIds[0] },
        body: "سلام، این یک پیام آزمایشی است.",
        deepLink: "/users/search",
        expectedRecipients: 1,
        title: "پیام آزمون",
      }),
    );
    expect(single.sent).toBe(1);

    const segment = await sendBroadcast(
      actor,
      BroadcastSchema.parse({
        audience: { kind: "province", provinceId },
        body: "اطلاعیه استانی برای آزمون.",
        expectedRecipients: 3,
        title: "اطلاعیه استان",
      }),
    );
    expect(segment.sent).toBe(3);

    const rows = await prisma.notification.findMany({
      include: { notificationDeliveries: true },
      where: { user: { phone: { in: PHONES } } },
    });
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.type === "admin_broadcast" && row.notificationDeliveries.length === 1)).toBe(true);
    const withLink = rows.find((row) => (row.data as { campaignId?: string }).campaignId === single.campaignId);
    expect(withLink?.data).toMatchObject({ campaignId: single.campaignId, deepLink: "/users/search", v: 1 });

    const campaigns = await listCampaigns(1);
    const found = campaigns.items.find((item) => item.campaignId === segment.campaignId);
    expect(found).toMatchObject({ plannedRecipients: 3, queued: 3, read: 0, total: 3, title: "اطلاعیه استان" });
    expect(found?.audience).toMatchObject({ kind: "province", provinceName: PROVINCE_NAME });

    const detail = await getCampaign(segment.campaignId, { page: 1, read: "all" });
    expect(detail?.recipients.total).toBe(3);

    const explorer = await listNotifications({
      page: 1,
      perPage: 20,
      period: "all",
      q: PHONES[0],
      read: "all",
      recipient: "all",
      type: "admin_broadcast",
    });
    expect(explorer.total).toBe(2);
  });

  it("refuses an empty audience and a stale recipient count", async () => {
    await expect(
      sendBroadcast(actor, BroadcastSchema.parse({ audience: { kind: "province", provinceId }, body: "متن آزمون", expectedRecipients: 2, title: "عنوان" })),
    ).rejects.toMatchObject({ status: 409 });
    const empty = await prisma.province.create({ data: { name: `${PROVINCE_NAME} خالی` } });
    await expect(
      sendBroadcast(actor, BroadcastSchema.parse({ audience: { kind: "province", provinceId: Number(empty.id) }, body: "متن آزمون", expectedRecipients: 0, title: "عنوان" })),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("replays a dead delivery and the whole dead-letter queue", async () => {
    const deliveries = await prisma.notificationDelivery.findMany({
      where: { notification: { user: { phone: { in: PHONES.slice(0, 2) } } } },
    });
    await prisma.notificationDelivery.updateMany({
      data: { attemptsCount: 5, errorMessage: "simulated_failure", failedAt: new Date(), status: "failed" },
      where: { id: { in: deliveries.map((row) => row.id) } },
    });

    const health = await getDeliveryHealth({ channel: "all", page: 1, status: "dead" });
    expect(health.summary.dead).toBeGreaterThanOrEqual(deliveries.length);

    await replayDelivery(actor, deliveries[0]!.id.toString());
    const replayed = await prisma.notificationDelivery.findUniqueOrThrow({ where: { id: deliveries[0]!.id } });
    expect(replayed).toMatchObject({ attemptsCount: 0, errorMessage: null, status: "queued" });
    await expect(replayDelivery(actor, deliveries[0]!.id.toString())).rejects.toMatchObject({ status: 409 });

    const all = await replayDeadDeliveries(actor);
    expect(all.requeued).toBeGreaterThanOrEqual(deliveries.length - 1);
    const left = await prisma.notificationDelivery.count({
      where: { id: { in: deliveries.map((row) => row.id) }, status: "failed" },
    });
    expect(left).toBe(0);

    const audit = await prisma.adminAuditLog.count({
      where: { action: { in: ["notifications.delivery_replay", "notifications.delivery_replay_all"] }, adminId: actor.adminId },
    });
    expect(audit).toBe(2);
  });
});
