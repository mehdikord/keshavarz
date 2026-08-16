import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { invalidateCatalogCache } from "@/server/modules/catalog/catalog.cache";
import {
  getCatalogCategories,
  getCatalogCategoryServices,
  getCatalogService,
} from "@/server/modules/catalog/catalog.service";
import {
  createCurrentUserLand,
  deleteCurrentUserLand,
  getCurrentUserLand,
  updateCurrentUserLand,
} from "@/server/modules/lands/lands.service";
import {
  addCurrentProviderService,
  deactivateCurrentProviderService,
  getCurrentProviderDashboard,
  getCurrentProviderProfile,
  patchCurrentProviderWorkArea,
  updateCurrentProviderService,
  upsertCurrentProviderProfile,
} from "@/server/modules/provider/provider.service";

const phones = ["09993000001", "09993000002"];

async function createUser(phone: string) {
  return prisma.user.create({
    data: {
      phone,
      publicId: createPublicId(),
    },
  });
}

async function cleanup() {
  invalidateCatalogCache();
  await prisma.providerServicePriceHistory.deleteMany({
    where: { changedByUser: { phone: { in: phones } } },
  });
  await prisma.providerService.deleteMany({
    where: { providerProfile: { user: { phone: { in: phones } } } },
  });
  await prisma.providerProfile.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.serviceRequest.deleteMany({
    where: { consumer: { phone: { in: phones } } },
  });
  await prisma.land.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });

  await prisma.service.deleteMany({
    where: { slug: { in: ["phase5-test-plant", "phase5-test-harvest"] } },
  });
  await prisma.serviceCategory.deleteMany({
    where: { slug: { in: ["phase5-test-category", "phase5-deleted-category"] } },
  });
}

describe.sequential("phase 05 profile/catalog/lands/provider", () => {
  beforeAll(async () => {
    await cleanup();

    const category = await prisma.serviceCategory.create({
      data: {
        name: "دسته فاز۵",
        slug: "phase5-test-category",
        sortOrder: 1,
      },
    });
    await prisma.serviceCategory.create({
      data: {
        deletedAt: new Date(),
        isActive: 0,
        name: "حذف‌شده",
        slug: "phase5-deleted-category",
        sortOrder: 99,
      },
    });
    await prisma.service.createMany({
      data: [
        {
          name: "کاشت تست",
          serviceCategoryId: category.id,
          slug: "phase5-test-plant",
          sortOrder: 1,
        },
        {
          deletedAt: new Date(),
          isActive: 0,
          name: "برداشت حذف‌شده",
          serviceCategoryId: category.id,
          slug: "phase5-test-harvest",
          sortOrder: 2,
        },
      ],
    });
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("lists only active catalog items and caches reads", async () => {
    invalidateCatalogCache();
    const categories = await getCatalogCategories();
    expect(categories.some((item) => item.categoryId === "phase5-test-category")).toBe(
      true,
    );
    expect(
      categories.some((item) => item.categoryId === "phase5-deleted-category"),
    ).toBe(false);

    const services = await getCatalogCategoryServices("phase5-test-category");
    expect(services.map((item) => item.serviceId)).toEqual(["phase5-test-plant"]);

    const service = await getCatalogService("phase5-test-plant");
    expect(service.name).toBe("کاشت تست");
  });

  it("supports land CRUD with ownership scope and decimal precision", async () => {
    const owner = await createUser(phones[0]!);
    const stranger = await createUser(phones[1]!);

    const created = await createCurrentUserLand(owner.id, {
      areaSquareMeters: "1234.50",
      latitude: "35.6892000",
      longitude: "51.3890000",
      title: "زمین تست",
    });
    expect(created.areaSquareMeters).toBe("1234.5");
    expect(created.latitude).toContain("35.6892");
    expect(created.longitude).toContain("51.389");

    await expect(
      getCurrentUserLand(stranger.id, created.landId),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });

    const updated = await updateCurrentUserLand(owner.id, created.landId, {
      title: "زمین به‌روز",
    });
    expect(updated.title).toBe("زمین به‌روز");

    await expect(
      updateCurrentUserLand(stranger.id, created.landId, { title: "hack" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });

    await deleteCurrentUserLand(owner.id, created.landId);
    await expect(
      getCurrentUserLand(owner.id, created.landId),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("blocks soft-delete for land with request history", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { phone: phones[0]! },
    });
    const land = await createCurrentUserLand(owner.id, {
      areaSquareMeters: "100.00",
      latitude: "35.0000000",
      longitude: "51.0000000",
      title: "زمین با سابقه",
    });
    const landRow = await prisma.land.findUniqueOrThrow({
      where: { publicId: land.landId },
    });
    const service = await prisma.service.findUniqueOrThrow({
      where: { slug: "phase5-test-plant" },
    });
    await prisma.serviceRequest.create({
      data: {
        consumerNameSnapshot: owner.phone,
        consumerUserId: owner.id,
        landAreaSquareMetersSnapshot: landRow.areaSquareMeters,
        landId: landRow.id,
        landLatitudeSnapshot: landRow.latitude,
        landLongitudeSnapshot: landRow.longitude,
        landTitleSnapshot: landRow.title,
        publicId: createPublicId(),
        serviceCategoryNameSnapshot: "دسته فاز۵",
        serviceId: service.id,
        serviceNameSnapshot: service.name,
      },
    });

    await expect(
      deleteCurrentUserLand(owner.id, land.landId),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });
  });

  it("supports provider profile, work area eligibility and duplicate service safety", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { phone: phones[0]! },
    });

    const profile = await upsertCurrentProviderProfile(user.id, {
      bio: "ارائه‌دهنده تست",
    });
    expect(profile.bio).toBe("ارائه‌دهنده تست");
    expect(profile.eligibility.searchable).toBe(false);
    expect(profile.eligibility.missing).toEqual(
      expect.arrayContaining(["workArea", "subscription", "services"]),
    );

    await expect(
      patchCurrentProviderWorkArea(user.id, {
        workLatitude: "35.7",
        workLongitude: null,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    const withArea = await patchCurrentProviderWorkArea(user.id, {
      isAvailable: true,
      workLatitude: "35.7000000",
      workLongitude: "51.4000000",
      workRadiusKm: 40,
    });
    expect(withArea.workRadiusKm).toBe(40);
    expect(withArea.eligibility.missing).not.toContain("workArea");

    const service = await addCurrentProviderService(user.id, {
      priceToman: 1500,
      pricingUnit: "per_hectare",
      serviceId: "phase5-test-plant",
    });
    expect(service.providerServiceId).toBe("phase5-test-plant");
    expect(service.priceToman).toBe(1500);

    await expect(
      addCurrentProviderService(user.id, {
        priceToman: 2000,
        pricingUnit: "fixed",
        serviceId: "phase5-test-plant",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", status: 409 });

    const [first, second] = await Promise.allSettled([
      addCurrentProviderService(user.id, {
        priceToman: 3000,
        pricingUnit: "fixed",
        serviceId: "phase5-test-plant",
      }),
      addCurrentProviderService(user.id, {
        priceToman: 4000,
        pricingUnit: "fixed",
        serviceId: "phase5-test-plant",
      }),
    ]);
    expect(
      [first, second].filter((result) => result.status === "rejected"),
    ).toHaveLength(2);

    const updated = await updateCurrentProviderService(
      user.id,
      "phase5-test-plant",
      { priceToman: 2500 },
    );
    expect(updated.priceToman).toBe(2500);

    const histories = await prisma.providerServicePriceHistory.count({
      where: {
        providerService: {
          providerProfile: { userId: user.id },
          service: { slug: "phase5-test-plant" },
        },
      },
    });
    expect(histories).toBeGreaterThanOrEqual(2);

    const stranger = await prisma.user.findUniqueOrThrow({
      where: { phone: phones[1]! },
    });
    await upsertCurrentProviderProfile(stranger.id, { bio: null });
    await expect(
      updateCurrentProviderService(stranger.id, "phase5-test-plant", {
        priceToman: 9999,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });

    await deactivateCurrentProviderService(user.id, "phase5-test-plant");
    const profileAfter = await getCurrentProviderProfile(user.id);
    expect(profileAfter.eligibility.missing).toContain("services");

    const dashboard = await getCurrentProviderDashboard(user.id);
    expect(dashboard.counts.newRequests).toBe(0);
    expect(dashboard.counts.inProgressRequests).toBe(0);
    expect(dashboard.warnings).toEqual(
      expect.arrayContaining(["subscription", "services"]),
    );
  });

  it("rejects inactive catalog service for provider offerings", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { phone: phones[0]! },
    });
    await expect(
      addCurrentProviderService(user.id, {
        priceToman: 1500,
        pricingUnit: "fixed",
        serviceId: "phase5-test-harvest",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", status: 400 });
  });
});
