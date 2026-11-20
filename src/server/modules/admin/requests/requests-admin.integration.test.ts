import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { RequestsListQuerySchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import {
  cancelAdminRequest,
  completeAdminRequest,
  getAdminRequestDetail,
  listAdminRequests,
  withdrawAdminRequestLink,
} from "@/server/modules/admin/requests/requests-admin.service";

const ADMIN_PHONE = "09996300001";
const CONSUMER_PHONE = "09996300002";
const PROVIDER_PHONES = ["09996300003", "09996300004"];
const phones = [CONSUMER_PHONE, ...PROVIDER_PHONES];
const CATEGORY_SLUG = "admin-requests-test-category";
const SERVICE_SLUG = "admin-requests-test-service";

const request = new NextRequest("http://localhost/api/admins/v1/requests/test/cancel", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.3" },
  method: "POST",
});

let adminId: bigint;
let consumerId: bigint;
let landId: bigint;
let serviceId: bigint;
const providers: Array<{ profileId: bigint; providerServiceId: bigint; userId: bigint }> = [];

async function cleanup() {
  const consumer = { consumer: { phone: { in: phones } } };
  await prisma.notificationDelivery.deleteMany({ where: { notification: { user: { phone: { in: phones } } } } });
  await prisma.notification.deleteMany({ where: { user: { phone: { in: phones } } } });
  await prisma.serviceRequestProviderHistory.deleteMany({ where: { requestProvider: { request: consumer } } });
  await prisma.serviceRequestProvider.deleteMany({ where: { request: consumer } });
  await prisma.serviceRequestCandidate.deleteMany({ where: { request: consumer } });
  await prisma.serviceRequestDate.deleteMany({ where: { request: consumer } });
  await prisma.serviceRequestStatusHistory.deleteMany({ where: { request: consumer } });
  await prisma.serviceRequest.deleteMany({ where: consumer });
  await prisma.providerService.deleteMany({ where: { providerProfile: { user: { phone: { in: phones } } } } });
  await prisma.providerProfile.deleteMany({ where: { user: { phone: { in: phones } } } });
  await prisma.land.deleteMany({ where: { user: { phone: { in: phones } } } });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
  await prisma.service.deleteMany({ where: { slug: SERVICE_SLUG } });
  await prisma.serviceCategory.deleteMany({ where: { slug: CATEGORY_SLUG } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
}

async function createRequest(input: {
  assigned?: number;
  invite?: Array<{ provider: number; status: "sent" | "accepted" | "rejected" }>;
  status: "awaiting_send" | "pending_provider" | "in_progress" | "completed";
}) {
  const land = await prisma.land.findUniqueOrThrow({ where: { id: landId } });
  const assigned = input.assigned === undefined ? null : providers[input.assigned]!;
  const created = await prisma.serviceRequest.create({
    data: {
      acceptedAt: assigned ? new Date() : null,
      agreedPriceToman: assigned ? BigInt(2_500_000) : null,
      assignedProviderNameSnapshot: assigned ? "خدمات‌دهنده آزمون" : null,
      assignedProviderProfileId: assigned?.profileId ?? null,
      completedAt: input.status === "completed" ? new Date() : null,
      consumerNameSnapshot: "کشاورز آزمون درخواست",
      consumerNote: "لطفاً صبح زود",
      consumerUserId: consumerId,
      landAreaSquareMetersSnapshot: land.areaSquareMeters,
      landId,
      landLatitudeSnapshot: land.latitude,
      landLongitudeSnapshot: land.longitude,
      landTitleSnapshot: land.title,
      publicId: createPublicId(),
      serviceCategoryNameSnapshot: "دسته آزمون درخواست",
      serviceId,
      serviceNameSnapshot: "شخم آزمون درخواست",
      serviceRequestDates: { create: [{ scheduledDate: new Date("2026-12-01"), sortOrder: 0 }] },
      status: input.status,
    },
  });
  for (const invite of input.invite ?? []) {
    const provider = providers[invite.provider]!;
    await prisma.serviceRequestProvider.create({
      data: {
        distanceKm: "3.50",
        providerNameSnapshot: `خدمات‌دهنده ${invite.provider + 1}`,
        providerProfileId: provider.profileId,
        providerServiceId: provider.providerServiceId,
        serviceRequestId: created.id,
        servicePriceSnapshotToman: BigInt(2_500_000),
        status: invite.status,
      },
    });
  }
  return created;
}

describe.sequential("admin service requests", () => {
  beforeAll(async () => {
    await cleanup();
    adminId = (
      await prisma.admin.create({
        data: { name: "مدیر درخواست‌ها", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
      })
    ).id;
    const category = await prisma.serviceCategory.create({ data: { name: "دسته آزمون درخواست", slug: CATEGORY_SLUG } });
    serviceId = (
      await prisma.service.create({
        data: { name: "شخم آزمون درخواست", serviceCategoryId: category.id, slug: SERVICE_SLUG },
      })
    ).id;
    const consumer = await prisma.user.create({
      data: { name: "کشاورز آزمون درخواست", phone: CONSUMER_PHONE, publicId: createPublicId() },
    });
    consumerId = consumer.id;
    landId = (
      await prisma.land.create({
        data: { areaSquareMeters: "20000", latitude: "35.7", longitude: "51.4", publicId: createPublicId(), title: "زمین آزمون", userId: consumer.id },
      })
    ).id;
    for (const phone of PROVIDER_PHONES) {
      const user = await prisma.user.create({ data: { name: `ارائه ${phone}`, phone, publicId: createPublicId() } });
      const profile = await prisma.providerProfile.create({ data: { userId: user.id, workLatitude: "35.7", workLongitude: "51.4" } });
      const providerService = await prisma.providerService.create({
        data: { priceToman: BigInt(2_500_000), providerProfileId: profile.id, serviceId },
      });
      providers.push({ profileId: profile.id, providerServiceId: providerService.id, userId: user.id });
    }
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("lists with status counts, search and service filters", async () => {
    await createRequest({ status: "awaiting_send" });
    await createRequest({ invite: [{ provider: 0, status: "sent" }], status: "pending_provider" });
    await createRequest({ assigned: 0, invite: [{ provider: 0, status: "accepted" }], status: "completed" });

    const query = RequestsListQuerySchema.parse({ q: CONSUMER_PHONE });
    const list = await listAdminRequests(query);
    expect(list.total).toBe(3);
    expect(list.counts).toMatchObject({ all: 3, awaiting_send: 1, completed: 1, pending_provider: 1 });

    const byService = await listAdminRequests(RequestsListQuerySchema.parse({ service: `s:${serviceId}` }));
    expect(byService.total).toBe(3);

    const pending = await listAdminRequests(RequestsListQuerySchema.parse({ q: "کشاورز آزمون درخواست", status: "pending_provider" }));
    expect(pending.items).toHaveLength(1);
    expect(pending.items[0]!.providersInvited).toBe(1);

    const byId = await listAdminRequests(RequestsListQuerySchema.parse({ q: pending.items[0]!.id.toLowerCase() }));
    expect(byId.items.map((item) => item.id)).toEqual([pending.items[0]!.id]);
  });

  it("returns the full detail of a request", async () => {
    const created = await createRequest({ invite: [{ provider: 0, status: "sent" }, { provider: 1, status: "rejected" }], status: "pending_provider" });
    const detail = await getAdminRequestDetail(created.publicId);
    expect(detail).not.toBeNull();
    expect(detail!.links).toHaveLength(2);
    expect(detail!.dates).toEqual(["2026-12-01"]);
    expect(detail!.land.areaSquareMeters).toBe(20000);
    expect(detail!.consumer.phone).toBe(CONSUMER_PHONE);
    expect(await getAdminRequestDetail(createPublicId())).toBeNull();
  });

  it("withdraws a pending invitation and notifies that provider", async () => {
    const created = await createRequest({ invite: [{ provider: 0, status: "sent" }, { provider: 1, status: "sent" }], status: "pending_provider" });
    const link = await prisma.serviceRequestProvider.findFirstOrThrow({
      where: { providerProfileId: providers[0]!.profileId, serviceRequestId: created.id },
    });
    await withdrawAdminRequestLink({ adminId, request }, created.publicId, link.id.toString(), { reason: "خدمات‌دهنده در دسترس نیست" });

    const updated = await prisma.serviceRequestProvider.findUniqueOrThrow({ where: { id: link.id } });
    expect(updated).toMatchObject({ removedReason: "admin_removed", status: "removed" });
    const other = await prisma.serviceRequestProvider.findFirstOrThrow({
      where: { providerProfileId: providers[1]!.profileId, serviceRequestId: created.id },
    });
    expect(other.status).toBe("sent");
    expect(await prisma.notification.count({ where: { relatedServiceRequestId: created.id, userId: providers[0]!.userId } })).toBe(1);

    await expect(
      withdrawAdminRequestLink({ adminId, request }, created.publicId, link.id.toString(), { reason: "دوباره امتحان" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("cancels an open request: status, history, links, notifications and audit", async () => {
    const created = await createRequest({
      invite: [{ provider: 0, status: "sent" }, { provider: 1, status: "rejected" }],
      status: "pending_provider",
    });

    await expect(
      cancelAdminRequest({ adminId, request }, created.publicId, { expectedVersion: created.version + 5, reason: "نسخه قدیمی" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await cancelAdminRequest({ adminId, request }, created.publicId, {
      expectedVersion: created.version,
      reason: "درخواست تکراری بود",
    });

    const row = await prisma.serviceRequest.findUniqueOrThrow({ where: { id: created.id } });
    expect(row).toMatchObject({ cancelledBy: "admin", cancelledByAdminId: adminId, cancelReason: "درخواست تکراری بود", status: "cancelled" });
    expect(row.version).toBe(created.version + 1);

    const history = await prisma.serviceRequestStatusHistory.findFirstOrThrow({ where: { serviceRequestId: created.id, toStatus: "cancelled" } });
    expect(history).toMatchObject({ actorAdminId: adminId, actorType: "admin", fromStatus: "pending_provider" });

    const links = await prisma.serviceRequestProvider.findMany({ where: { serviceRequestId: created.id }, orderBy: { id: "asc" } });
    expect(links.map((link) => link.status)).toEqual(["removed", "rejected"]);

    const notified = await prisma.notification.findMany({ where: { relatedServiceRequestId: created.id }, select: { userId: true } });
    expect(notified.map((row) => row.userId).sort()).toEqual([consumerId, providers[0]!.userId].sort());

    const audit = await prisma.adminAuditLog.findFirst({ where: { action: "requests.cancel", adminId, auditableId: created.id } });
    expect(audit).not.toBeNull();

    const detail = await getAdminRequestDetail(created.publicId);
    expect(detail!.cancellation).toMatchObject({ by: "admin", byName: "مدیر درخواست‌ها", reason: "درخواست تکراری بود" });
    expect(detail!.audits[0]!.label).toBe("لغو درخواست");
  });

  it("refuses to cancel a finished request", async () => {
    const created = await createRequest({ assigned: 0, invite: [{ provider: 0, status: "accepted" }], status: "completed" });
    await expect(
      cancelAdminRequest({ adminId, request }, created.publicId, { expectedVersion: created.version, reason: "دیگر لازم نیست" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("completes an in-progress request on the consumer's behalf", async () => {
    const pending = await createRequest({ invite: [{ provider: 0, status: "sent" }], status: "pending_provider" });
    await expect(
      completeAdminRequest({ adminId, request }, pending.publicId, { expectedVersion: pending.version, reason: "تأیید تلفنی" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const created = await createRequest({ assigned: 1, invite: [{ provider: 1, status: "accepted" }], status: "in_progress" });
    await completeAdminRequest({ adminId, request }, created.publicId, {
      expectedVersion: created.version,
      reason: "خدمات‌گیرنده تلفنی تأیید کرد",
    });

    const row = await prisma.serviceRequest.findUniqueOrThrow({ where: { id: created.id } });
    expect(row.status).toBe("completed");
    expect(row.completedAt).not.toBeNull();
    const history = await prisma.serviceRequestStatusHistory.findFirstOrThrow({ where: { serviceRequestId: created.id, toStatus: "completed" } });
    expect(history).toMatchObject({ actorAdminId: adminId, actorType: "admin", reason: "خدمات‌گیرنده تلفنی تأیید کرد" });
    const notified = await prisma.notification.findMany({ where: { relatedServiceRequestId: created.id }, select: { userId: true } });
    expect(notified.map((entry) => entry.userId).sort()).toEqual([consumerId, providers[1]!.userId].sort());
  });
});
