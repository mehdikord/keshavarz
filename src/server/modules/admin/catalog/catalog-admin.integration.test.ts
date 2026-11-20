import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import { CategoryCreateSchema, ServiceCreateSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import {
  createAdminCategory,
  createAdminService,
  deleteAdminCategory,
  deleteAdminService,
  listAdminCategories,
  listAdminServices,
  removeCatalogImage,
  reorderAdminServices,
  updateAdminCategory,
  updateAdminService,
  uploadCatalogImage,
} from "@/server/modules/admin/catalog/catalog-admin.service";
import { invalidateCatalogCache } from "@/server/modules/catalog/catalog.cache";
import { getCatalogCategoryServices } from "@/server/modules/catalog/catalog.service";

const ADMIN_PHONE = "09996200001";
const USER_PHONE = "09996200002";
const CATEGORY_NAME = "دسته آزمون کاتالوگ";

const request = new NextRequest("http://localhost/api/admins/v1/catalog/services", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.2" },
  method: "POST",
});

/** In-memory storage that records what was written and removed. */
class MemoryStorage implements ObjectStorage {
  readonly files = new Map<string, Uint8Array>();
  readonly deleted: string[] = [];
  async put(input: { contentType: string; data: Uint8Array; key: string }) {
    this.files.set(input.key, input.data);
    return { url: `/storage/test/${input.key}` };
  }
  async delete(key: string) {
    this.deleted.push(key);
    this.files.delete(key);
  }
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const pngFile = (name = "planter.png") => new File([PNG], name, { type: "image/png" });

let adminId: bigint;
let actor: { adminId: bigint; request: NextRequest };

async function cleanup() {
  const categories = await prisma.serviceCategory.findMany({
    select: { id: true },
    where: { name: { startsWith: CATEGORY_NAME } },
  });
  const categoryIds = categories.map((row) => row.id);
  const services = await prisma.service.findMany({ select: { id: true }, where: { serviceCategoryId: { in: categoryIds } } });
  const serviceIds = services.map((row) => row.id);
  await prisma.serviceRequest.deleteMany({ where: { serviceId: { in: serviceIds } } });
  await prisma.land.deleteMany({ where: { user: { phone: USER_PHONE } } });
  await prisma.user.deleteMany({ where: { phone: USER_PHONE } });
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } });
  await prisma.serviceCategory.deleteMany({ where: { id: { in: categoryIds } } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
  invalidateCatalogCache();
}

describe.sequential("admin catalog", () => {
  let categoryId: string;
  let categorySlug: string;
  let wheatId: string;
  let barleyId: string;

  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر کاتالوگ", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    adminId = admin.id;
    actor = { adminId, request };
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("creates a category with a generated slug and audits it", async () => {
    const created = await createAdminCategory(actor, CategoryCreateSchema.parse({ name: CATEGORY_NAME, slug: "" }));
    categoryId = created.id;
    const row = await prisma.serviceCategory.findUniqueOrThrow({ where: { id: BigInt(categoryId) } });
    expect(row.slug).toMatch(/^category-[a-z0-9]{8}$/);
    expect(row.createdByAdminId).toBe(adminId);
    categorySlug = row.slug;

    const audit = await prisma.adminAuditLog.findFirst({ where: { action: "catalog.categories.create", adminId } });
    expect(audit?.auditableId).toBe(row.id);
  });

  it("creates services, appends sort order and rejects duplicate names or slugs", async () => {
    wheatId = (await createAdminService(actor, ServiceCreateSchema.parse({ categoryId, name: "کاشت گندم آزمون" }))).id;
    barleyId = (
      await createAdminService(actor, ServiceCreateSchema.parse({ categoryId, name: "کاشت جو آزمون", slug: "test-barley-planting" }))
    ).id;

    const rows = await prisma.service.findMany({ orderBy: { sortOrder: "asc" }, where: { serviceCategoryId: BigInt(categoryId) } });
    expect(rows.map((row) => row.id.toString())).toEqual([wheatId, barleyId]);
    expect(rows[1]!.sortOrder).toBe(rows[0]!.sortOrder + 1);

    await expect(
      createAdminService(actor, ServiceCreateSchema.parse({ categoryId, name: "کاشت گندم آزمون" })),
    ).rejects.toMatchObject({ code: "CONFLICT", fields: { name: expect.any(Array) } });
    await expect(
      createAdminService(actor, ServiceCreateSchema.parse({ categoryId, name: "دیگر", slug: "test-barley-planting" })),
    ).rejects.toMatchObject({ code: "CONFLICT", fields: { slug: expect.any(Array) } });
  });

  it("uploads, replaces and removes a service image, and the app catalog serves it", async () => {
    const storage = new MemoryStorage();
    const first = await uploadCatalogImage(actor, "service", wheatId, pngFile(), storage);
    expect(first.image).toMatch(/^\/storage\/test\/service-[0-9a-z]{26}\.png$/);

    invalidateCatalogCache();
    const appServices = await getCatalogCategoryServices(categorySlug);
    expect(appServices.find((service) => service.name === "کاشت گندم آزمون")?.image).toBe(first.image);

    const second = await uploadCatalogImage(actor, "service", wheatId, pngFile("new.png"), storage);
    expect(second.image).not.toBe(first.image);
    expect(storage.deleted).toEqual([first.image.split("/").at(-1)]);

    await removeCatalogImage(actor, "service", wheatId, storage);
    const row = await prisma.service.findUniqueOrThrow({ where: { id: BigInt(wheatId) } });
    expect(row.image).toBeNull();
    expect(storage.files.size).toBe(0);
  });

  it("rejects files that are not real images", async () => {
    const storage = new MemoryStorage();
    const fake = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], "x.png", { type: "image/png" });
    await expect(uploadCatalogImage(actor, "service", wheatId, fake, storage)).rejects.toMatchObject({ status: 415 });
    const gif = new File([PNG], "x.gif", { type: "image/gif" });
    await expect(uploadCatalogImage(actor, "service", wheatId, gif, storage)).rejects.toMatchObject({ status: 415 });
    expect(storage.files.size).toBe(0);
  });

  it("updates, deactivates and reorders services; inactive ones leave the app catalog", async () => {
    await updateAdminService(actor, wheatId, { description: "با بذرکار", name: "کاشت گندم آزمون" });
    await updateAdminService(actor, barleyId, { isActive: false });

    invalidateCatalogCache();
    const appServices = await getCatalogCategoryServices(categorySlug);
    expect(appServices.map((service) => service.name)).toEqual(["کاشت گندم آزمون"]);

    await reorderAdminServices(actor, categoryId, [barleyId, wheatId]);
    const list = await listAdminServices({ category: categoryId, page: 1, perPage: 20, sort: "order", status: "all" });
    expect(list.items.map((item) => item.id)).toEqual([barleyId, wheatId]);
    expect(list.counts).toEqual({ active: 1, all: 2, inactive: 1 });

    await expect(reorderAdminServices(actor, categoryId, [wheatId])).rejects.toMatchObject({ code: "CONFLICT" });

    const audits = await prisma.adminAuditLog.findMany({ select: { action: true }, where: { adminId, module: "catalog" } });
    expect(audits.map((row) => row.action)).toEqual(
      expect.arrayContaining(["catalog.services.update", "catalog.services.deactivate", "catalog.services.reorder"]),
    );
  });

  it("keeps used services and non-empty categories from being deleted", async () => {
    const user = await prisma.user.create({ data: { name: "کشاورز آزمون", phone: USER_PHONE, publicId: createPublicId() } });
    const land = await prisma.land.create({
      data: { areaSquareMeters: "1000", latitude: "35.7", longitude: "51.4", publicId: createPublicId(), title: "زمین", userId: user.id },
    });
    await prisma.serviceRequest.create({
      data: {
        consumerNameSnapshot: "کشاورز آزمون",
        consumerUserId: user.id,
        landAreaSquareMetersSnapshot: land.areaSquareMeters,
        landId: land.id,
        landLatitudeSnapshot: land.latitude,
        landLongitudeSnapshot: land.longitude,
        landTitleSnapshot: land.title,
        publicId: createPublicId(),
        serviceCategoryNameSnapshot: CATEGORY_NAME,
        serviceId: BigInt(wheatId),
        serviceNameSnapshot: "کاشت گندم آزمون",
      },
    });

    await expect(deleteAdminService(actor, wheatId, new MemoryStorage())).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(deleteAdminCategory(actor, categoryId, new MemoryStorage())).rejects.toMatchObject({ code: "CONFLICT" });

    const categories = await listAdminCategories({ q: CATEGORY_NAME, status: "all" });
    expect(categories.items[0]).toMatchObject({ activeServicesCount: 1, requestsCount: 1, servicesCount: 2 });

    await deleteAdminService(actor, barleyId, new MemoryStorage());
    expect(await prisma.service.findUnique({ where: { id: BigInt(barleyId) } })).toBeNull();
  });

  it("moves a service to another category and deletes an empty category", async () => {
    const other = await createAdminCategory(actor, CategoryCreateSchema.parse({ name: `${CATEGORY_NAME} ۲` }));
    await updateAdminService(actor, wheatId, { categoryId: other.id });
    const moved = await prisma.service.findUniqueOrThrow({ where: { id: BigInt(wheatId) } });
    expect(moved.serviceCategoryId.toString()).toBe(other.id);

    await updateAdminCategory(actor, categoryId, { isActive: false });
    await deleteAdminCategory(actor, categoryId, new MemoryStorage());
    expect(await prisma.serviceCategory.findUnique({ where: { id: BigInt(categoryId) } })).toBeNull();
  });
});
