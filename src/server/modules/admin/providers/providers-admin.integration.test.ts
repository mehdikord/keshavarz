import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  ProviderServiceCreateSchema,
  ProvidersListQuerySchema,
  ProviderWorkAreaSchema,
} from "@/server/modules/admin/providers/providers-admin.schemas";
import {
  addAdminProviderService,
  deleteAdminProviderService,
  getAdminProviderDetail,
  listAdminProviders,
  setAdminProviderApproval,
  setAdminProviderStatus,
  updateAdminProviderProfile,
  updateAdminProviderService,
  updateAdminProviderWorkArea,
} from "@/server/modules/admin/providers/providers-admin.service";
import { getCurrentProviderProfile } from "@/server/modules/provider/provider.service";

const ADMIN_PHONE = "09996500001";
const PROVIDER_PHONE = "09996500002";
const CATEGORY_SLUG = "test-admin-providers-cat";
const SERVICE_SLUGS = ["test-admin-providers-a", "test-admin-providers-b"];

const request = new NextRequest("http://localhost/api/admins/v1/providers/test", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.3" },
  method: "POST",
});

let actor: { adminId: bigint; request: NextRequest };
let providerPublicId: string;
let userId: bigint;
let serviceAId: string;
let serviceBId: string;

async function cleanup() {
  const users = await prisma.user.findMany({ select: { id: true }, where: { phone: PROVIDER_PHONE } });
  const userIds = users.map((row) => row.id);
  await prisma.providerSubscription.deleteMany({ where: { providerProfile: { userId: { in: userIds } } } });
  await prisma.providerService.deleteMany({ where: { providerProfile: { userId: { in: userIds } } } });
  await prisma.providerProfile.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.service.deleteMany({ where: { slug: { in: SERVICE_SLUGS } } });
  await prisma.serviceCategory.deleteMany({ where: { slug: CATEGORY_SLUG } });
  await prisma.subscriptionPlan.deleteMany({ where: { code: "test-admin-providers-plan" } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
}

const listQuery = (overrides: Record<string, string> = {}) =>
  ProvidersListQuerySchema.parse({ q: PROVIDER_PHONE, ...overrides });

describe.sequential("admin providers", () => {
  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر خدمات‌دهندگان", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    actor = { adminId: admin.id, request };

    const user = await prisma.user.create({
      data: { name: "خدمات‌دهنده آزمون", phone: PROVIDER_PHONE, publicId: createPublicId() },
    });
    userId = user.id;
    providerPublicId = user.publicId;
    await prisma.providerProfile.create({ data: { userId: user.id } });

    const category = await prisma.serviceCategory.create({ data: { name: "دسته آزمون پنل", slug: CATEGORY_SLUG } });
    const [a, b] = await Promise.all([
      prisma.service.create({ data: { name: "کاشت آزمون پنل", serviceCategoryId: category.id, slug: SERVICE_SLUGS[0]! } }),
      prisma.service.create({
        data: { isActive: 0, name: "برداشت آزمون پنل", serviceCategoryId: category.id, slug: SERVICE_SLUGS[1]! },
      }),
    ]);
    serviceAId = a.id.toString();
    serviceBId = b.id.toString();
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("lists the new provider with the same eligibility gaps as the app", async () => {
    const list = await listAdminProviders(listQuery({ status: "any" }));
    const item = list.items.find((row) => row.id === providerPublicId);
    expect(item).toBeDefined();
    const app = await getCurrentProviderProfile(userId);
    expect(item!.missing).toEqual(app.eligibility.missing);
    expect(item!.missing).toEqual(expect.arrayContaining(["workArea", "subscription", "services"]));
    expect(list.counts.eligible).toBe(0);
  });

  it("validates and saves the work area", () => {
    expect(ProviderWorkAreaSchema.safeParse({ workLatitude: 35.7, workLongitude: null, workRadiusKm: 50 }).success).toBe(false);
    expect(ProviderWorkAreaSchema.safeParse({ workLatitude: 95, workLongitude: 51, workRadiusKm: 50 }).success).toBe(false);
    expect(ProviderWorkAreaSchema.safeParse({ workLatitude: 35.7, workLongitude: 51.4, workRadiusKm: 10 }).success).toBe(false);
    expect(ProviderWorkAreaSchema.safeParse({ workLatitude: 35.7, workLongitude: 51.4, workRadiusKm: 120 }).success).toBe(false);
  });

  it("stores the work area at DB precision and audits it", async () => {
    await updateAdminProviderWorkArea(
      actor,
      providerPublicId,
      ProviderWorkAreaSchema.parse({ workLatitude: "35.71234567", workLongitude: 51.4, workRadiusKm: 45 }),
    );
    const detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.workArea).toEqual({ latitude: "35.7123457", longitude: "51.4", radiusKm: 45 });
    const audit = await prisma.adminAuditLog.findFirst({ where: { action: "providers.work_area", adminId: actor.adminId } });
    expect(audit).not.toBeNull();
  });

  it("adds, re-prices, deactivates and reactivates a service with admin price history", async () => {
    await expect(
      addAdminProviderService(
        actor,
        providerPublicId,
        ProviderServiceCreateSchema.parse({ priceToman: 5000, serviceId: serviceBId }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(ProviderServiceCreateSchema.safeParse({ priceToman: 500, serviceId: serviceAId }).success).toBe(false);

    const created = await addAdminProviderService(
      actor,
      providerPublicId,
      ProviderServiceCreateSchema.parse({ priceToman: 900_000, pricingUnit: "per_hectare", serviceId: serviceAId }),
    );
    expect(created.reactivated).toBe(false);
    await expect(
      addAdminProviderService(actor, providerPublicId, ProviderServiceCreateSchema.parse({ priceToman: 1000, serviceId: serviceAId })),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await updateAdminProviderService(actor, providerPublicId, created.id, { priceToman: 1_200_000 });
    await updateAdminProviderService(actor, providerPublicId, created.id, { isActive: false });

    const again = await addAdminProviderService(
      actor,
      providerPublicId,
      ProviderServiceCreateSchema.parse({ priceToman: 1_300_000, serviceId: serviceAId }),
    );
    expect(again).toEqual({ id: created.id, reactivated: true });

    const history = await prisma.providerServicePriceHistory.findMany({
      orderBy: { id: "asc" },
      where: { providerServiceId: BigInt(created.id) },
    });
    expect(history.map((row) => [row.changedBy, row.oldPriceToman, row.newPriceToman])).toEqual([
      ["admin", null, BigInt(900_000)],
      ["admin", BigInt(900_000), BigInt(1_200_000)],
      ["admin", BigInt(1_200_000), BigInt(1_300_000)],
    ]);
    expect(history.every((row) => row.changedByAdminId === actor.adminId)).toBe(true);
  });

  it("becomes searchable once subscribed, and drops out when deactivated", async () => {
    const plan = await prisma.subscriptionPlan.create({
      data: { code: "test-admin-providers-plan", durationMonths: 1, name: "پلن آزمون", priceToman: 1000 },
    });
    const profile = await prisma.providerProfile.findUniqueOrThrow({ where: { userId } });
    await prisma.providerSubscription.create({
      data: {
        activatedAt: new Date(),
        amountToman: 0,
        endsAt: new Date(Date.now() + 86_400_000),
        planNameSnapshot: plan.name,
        providerProfileId: profile.id,
        publicId: createPublicId(),
        source: "admin_grant",
        startsAt: new Date(Date.now() - 1000),
        status: "active",
        subscriptionPlanId: plan.id,
      },
    });

    let detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.eligibility).toEqual({ missing: [], searchable: true });
    const list = await listAdminProviders(listQuery({ status: "eligible" }));
    expect(list.items.map((row) => row.id)).toContain(providerPublicId);

    await setAdminProviderStatus(actor, providerPublicId, { isActive: false, reason: "بررسی مدارک" });
    await expect(
      setAdminProviderStatus(actor, providerPublicId, { isActive: false, reason: "دوباره" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.eligibility.missing).toEqual(["active"]);
    expect((await listAdminProviders(listQuery({ status: "inactive" }))).items.map((row) => row.id)).toContain(providerPublicId);

    await setAdminProviderStatus(actor, providerPublicId, { isActive: true, reason: "مدارک تأیید شد" });
    await updateAdminProviderProfile(actor, providerPublicId, { bio: "دارای دو دستگاه بذرکار", isAvailable: false });
    detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.bio).toBe("دارای دو دستگاه بذرکار");
    expect(detail?.eligibility.missing).toEqual(["availability"]);
  });

  it("approves and un-approves", async () => {
    await setAdminProviderApproval(actor, providerPublicId, true);
    let detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.approvedAt).not.toBeNull();
    expect(detail?.approvedBy).toBe("مدیر خدمات‌دهندگان");
    await expect(setAdminProviderApproval(actor, providerPublicId, true)).rejects.toMatchObject({ code: "CONFLICT" });
    await setAdminProviderApproval(actor, providerPublicId, false);
    detail = await getAdminProviderDetail(providerPublicId);
    expect(detail?.approvedAt).toBeNull();
  });

  it("deletes an unused service", async () => {
    const detail = await getAdminProviderDetail(providerPublicId);
    const service = detail!.services[0]!;
    expect(service.canDelete).toBe(true);
    await deleteAdminProviderService(actor, providerPublicId, service.id);
    expect((await getAdminProviderDetail(providerPublicId))!.services).toHaveLength(0);
  });
});
