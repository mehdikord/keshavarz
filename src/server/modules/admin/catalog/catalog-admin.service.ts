import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import { putImage, readValidatedImage, removeImageQuietly, resolveImageStorage } from "@/server/media/image-upload";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countCategoriesPerStatus,
  countRequestsPerCategory,
  countServiceReferences,
  countServicesInCategory,
  countServicesPerCategory,
  countServicesPerStatus,
  countSpecialServices,
  findCategoryById,
  findCategoryIdBySlug,
  findServiceById,
  findServiceDetails,
  findServiceIdByName,
  findServiceIdBySlug,
  hardDeleteCategory,
  hardDeleteService,
  insertCategory,
  insertService,
  listCategoryOptions,
  listCategoryRows,
  listLiveCategoryIds,
  listLiveServiceIdsInCategory,
  listServiceRows,
  nextCategorySortOrder,
  nextServiceSortOrder,
  setCategorySortOrder,
  setServiceSortOrder,
  updateCategoryRow,
  updateServiceRow,
} from "@/server/modules/admin/catalog/catalog-admin.repository";
import type {
  CategoriesListQuery,
  CategoryCreateInput,
  CategoryUpdateInput,
  ServiceCreateInput,
  ServiceUpdateInput,
  ServicesListQuery,
} from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { parseStoredRichDoc, type RichDoc } from "@/lib/rich-content/rich-content";
import { invalidateCatalogCache } from "@/server/modules/catalog/catalog.cache";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "catalog";
const CATEGORY_SUBJECT = "service_category";
const SERVICE_SUBJECT = "service";
const CATEGORY_IMAGE_PATH = "catalog/categories";
const SERVICE_IMAGE_PATH = "catalog/services";

const iso = (value: Date) => value.toISOString();

function conflict(field: string, message: string): never {
  throw new ApiError(409, API_ERROR_CODES.conflict, message, { fields: { [field]: [message] } });
}

function rethrowPrisma(error: unknown): never {
  const mapped = mapPrismaError(error);
  throw mapped ?? error;
}

function randomSlug(prefix: string): string {
  // ULID's random tail, lower-cased: url-safe and collision-resistant.
  return `${prefix}-${createPublicId().slice(-8).toLowerCase()}`;
}

async function generateSlug(prefix: string, exists: (slug: string) => Promise<boolean>) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = randomSlug(prefix);
    if (!(await exists(slug))) return slug;
  }
  throw new ApiError(409, API_ERROR_CODES.conflict, "ساخت شناسه لاتین ممکن نشد؛ دوباره تلاش کنید.");
}

// ======================================================================= categories

export interface AdminCategoryItem {
  activeServicesCount: number;
  createdAt: string;
  description: string | null;
  id: string;
  image: string | null;
  isActive: boolean;
  name: string;
  requestsCount: number;
  servicesCount: number;
  slug: string;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminCategoryList {
  counts: { active: number; all: number; inactive: number };
  items: AdminCategoryItem[];
}

export async function listAdminCategories(query: CategoriesListQuery): Promise<AdminCategoryList> {
  const [rows, counts] = await Promise.all([listCategoryRows(query), countCategoriesPerStatus(query.q)]);
  const ids = rows.map((row) => row.id);
  const [serviceCounts, requestCounts] = await Promise.all([countServicesPerCategory(ids), countRequestsPerCategory(ids)]);

  return {
    counts,
    items: rows.map((row) => {
      const own = serviceCounts.filter((entry) => entry.serviceCategoryId === row.id);
      const total = own.reduce((sum, entry) => sum + entry._count._all, 0);
      const active = own.find((entry) => entry.isActive === 1)?._count._all ?? 0;
      return {
        activeServicesCount: active,
        createdAt: iso(row.createdAt),
        description: row.description,
        id: row.id.toString(),
        image: row.image,
        isActive: row.isActive === 1,
        name: row.name,
        requestsCount: requestCounts.get(row.id.toString()) ?? 0,
        servicesCount: total,
        slug: row.slug,
        sortOrder: row.sortOrder,
        updatedAt: iso(row.updatedAt),
      };
    }),
  };
}

export async function getCategoryOptions(): Promise<Array<{ id: string; isActive: boolean; name: string }>> {
  const rows = await listCategoryOptions();
  return rows.map((row) => ({ id: row.id.toString(), isActive: row.isActive === 1, name: row.name }));
}

async function requireCategory(transaction: TransactionClient, id: string) {
  const category = await findCategoryById(transaction, BigInt(id));
  if (!category) throw new ApiError(404, API_ERROR_CODES.notFound, "دسته‌بندی پیدا نشد.");
  return category;
}

async function assertCategorySlugFree(transaction: TransactionClient, slug: string, selfId?: bigint) {
  const owner = await findCategoryIdBySlug(transaction, slug);
  if (owner && owner.id !== selfId) {
    conflict(
      "slug",
      owner.deletedAt
        ? "این شناسه لاتین متعلق به دسته‌ای حذف‌شده است؛ شناسه دیگری انتخاب کنید."
        : "این شناسه لاتین برای دسته دیگری ثبت شده است.",
    );
  }
}

export async function createAdminCategory(actor: Actor, input: CategoryCreateInput): Promise<{ id: string }> {
  try {
    const created = await runInTransaction(async (transaction) => {
      if (input.slug) await assertCategorySlugFree(transaction, input.slug);
      const slug =
        input.slug ??
        (await generateSlug("category", async (value) => Boolean(await findCategoryIdBySlug(transaction, value))));
      const sortOrder = input.sortOrder ?? (await nextCategorySortOrder(transaction));

      const row = await insertCategory(transaction, {
        createdByAdminId: actor.adminId,
        description: input.description,
        isActive: input.isActive ? 1 : 0,
        name: input.name,
        slug,
        sortOrder,
        updatedByAdminId: actor.adminId,
      });

      await recordAdminAudit(
        {
          action: "catalog.categories.create",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { description: row.description, isActive: row.isActive, name: row.name, slug: row.slug, sortOrder },
          request: actor.request,
          subject: { id: row.id, type: CATEGORY_SUBJECT },
        },
        transaction,
      );
      return row;
    });
    invalidateCatalogCache();
    return { id: created.id.toString() };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    rethrowPrisma(error);
  }
}

export async function updateAdminCategory(actor: Actor, id: string, input: CategoryUpdateInput): Promise<void> {
  try {
    await runInTransaction(async (transaction) => {
      const current = await requireCategory(transaction, id);
      if (input.slug && input.slug !== current.slug) await assertCategorySlugFree(transaction, input.slug, current.id);

      const data = {
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      };
      const updated = await updateCategoryRow(transaction, current.id, { ...data, updatedByAdminId: actor.adminId });

      await recordAdminAudit(
        {
          action: input.isActive !== undefined && Object.keys(data).length === 1
            ? input.isActive
              ? "catalog.categories.activate"
              : "catalog.categories.deactivate"
            : "catalog.categories.update",
          adminId: actor.adminId,
          module: MODULE,
          newValues: pick(updated, Object.keys(data)),
          oldValues: pick(current, Object.keys(data)),
          request: actor.request,
          subject: { id: current.id, type: CATEGORY_SUBJECT },
        },
        transaction,
      );
    });
    invalidateCatalogCache();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    rethrowPrisma(error);
  }
}

/**
 * A category is removed only once it holds no services. Rows left behind by the
 * old panel's soft delete keep the category row alive (FK), so it is then
 * soft-deleted with its slug released for reuse.
 */
export async function deleteAdminCategory(
  actor: Actor,
  id: string,
  storage: ObjectStorage = resolveImageStorage(CATEGORY_IMAGE_PATH),
): Promise<void> {
  const removedImage = await runInTransaction(async (transaction) => {
    const current = await requireCategory(transaction, id);
    const services = await countServicesInCategory(transaction, current.id);
    if (services.live > 0) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "این دسته هنوز خدمت دارد. ابتدا خدمات آن را به دسته دیگری منتقل یا حذف کنید، یا دسته را غیرفعال کنید.",
      );
    }

    if (services.total === 0) {
      await hardDeleteCategory(transaction, current.id);
    } else {
      await updateCategoryRow(transaction, current.id, {
        deletedAt: systemClock.now(),
        image: null,
        isActive: 0,
        slug: `${current.slug.slice(0, 140)}-deleted-${current.id.toString()}`,
        updatedByAdminId: actor.adminId,
      });
    }

    await recordAdminAudit(
      {
        action: "catalog.categories.delete",
        adminId: actor.adminId,
        module: MODULE,
        oldValues: { image: current.image, isActive: current.isActive, name: current.name, slug: current.slug },
        request: actor.request,
        subject: { id: current.id, type: CATEGORY_SUBJECT },
      },
      transaction,
    );
    return current.image;
  });
  invalidateCatalogCache();
  await removeImageQuietly(storage, removedImage);
}

export async function reorderAdminCategories(actor: Actor, ids: string[]): Promise<void> {
  await runInTransaction(async (transaction) => {
    const live = new Set((await listLiveCategoryIds(transaction)).map(String));
    if (ids.length !== live.size || ids.some((id) => !live.has(id))) {
      throw new ApiError(409, API_ERROR_CODES.conflict, "فهرست دسته‌ها تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.");
    }
    for (const [index, id] of ids.entries()) {
      await setCategorySortOrder(transaction, BigInt(id), index + 1);
    }
    await recordAdminAudit(
      {
        action: "catalog.categories.reorder",
        adminId: actor.adminId,
        metadata: { order: ids },
        module: MODULE,
        request: actor.request,
      },
      transaction,
    );
  });
  invalidateCatalogCache();
}

// ========================================================================= services

export interface AdminServiceItem {
  category: { id: string; isActive: boolean; name: string };
  createdAt: string;
  description: string | null;
  id: string;
  image: string | null;
  isActive: boolean;
  isSpecial: boolean;
  name: string;
  providersCount: number;
  requestsCount: number;
  slug: string;
  sortOrder: number;
  updatedAt: string;
}

export interface AdminServiceList {
  categories: Array<{ id: string; isActive: boolean; name: string }>;
  counts: { active: number; all: number; inactive: number };
  items: AdminServiceItem[];
  page: number;
  /** Featured services in the whole catalog (ignores the list filters). */
  specialCount: number;
  pageCount: number;
  perPage: number;
  total: number;
}

export async function listAdminServices(query: ServicesListQuery): Promise<AdminServiceList> {
  const [{ rows, total }, counts, categories, specialCount] = await Promise.all([
    listServiceRows(query),
    countServicesPerStatus(query),
    getCategoryOptions(),
    countSpecialServices(),
  ]);

  return {
    categories,
    counts,
    items: rows.map((row) => ({
      category: { id: row.category.id.toString(), isActive: row.category.isActive === 1, name: row.category.name },
      createdAt: iso(row.createdAt),
      description: row.description,
      id: row.id.toString(),
      image: row.image,
      isActive: row.isActive === 1,
      isSpecial: row.isSpecial,
      name: row.name,
      providersCount: row._count.providerServices,
      requestsCount: row._count.serviceRequests,
      slug: row.slug,
      sortOrder: row.sortOrder,
      updatedAt: iso(row.updatedAt),
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    specialCount,
    total,
  };
}

/** The intro-page body, loaded on demand by the edit form (kept out of the list payload). */
export async function getAdminServiceDetails(id: string): Promise<{ details: RichDoc | null }> {
  const row = await findServiceDetails(BigInt(id));
  if (!row) throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت پیدا نشد.");
  return { details: parseStoredRichDoc(row.details) };
}

async function requireService(transaction: TransactionClient, id: string) {
  const service = await findServiceById(transaction, BigInt(id));
  if (!service) throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت پیدا نشد.");
  return service;
}

async function assertServiceSlugFree(transaction: TransactionClient, slug: string, selfId?: bigint) {
  const owner = await findServiceIdBySlug(transaction, slug);
  if (owner && owner.id !== selfId) conflict("slug", "این شناسه لاتین برای خدمت دیگری ثبت شده است.");
}

async function assertServiceNameFree(transaction: TransactionClient, categoryId: bigint, name: string, selfId?: bigint) {
  const owner = await findServiceIdByName(transaction, categoryId, name);
  if (owner && owner.id !== selfId) conflict("name", "خدمتی با همین نام در این دسته وجود دارد.");
}

export async function createAdminService(actor: Actor, input: ServiceCreateInput): Promise<{ id: string }> {
  try {
    const created = await runInTransaction(async (transaction) => {
      const category = await findCategoryById(transaction, BigInt(input.categoryId));
      if (!category) {
        throw new ApiError(400, API_ERROR_CODES.validationFailed, "دسته‌بندی انتخاب‌شده معتبر نیست.", {
          fields: { categoryId: ["دسته‌بندی انتخاب‌شده معتبر نیست."] },
        });
      }
      await assertServiceNameFree(transaction, category.id, input.name);
      if (input.slug) await assertServiceSlugFree(transaction, input.slug);
      const slug =
        input.slug ??
        (await generateSlug("service", async (value) => Boolean(await findServiceIdBySlug(transaction, value))));
      const sortOrder = input.sortOrder ?? (await nextServiceSortOrder(transaction, category.id));

      const row = await insertService(transaction, {
        createdByAdminId: actor.adminId,
        description: input.description,
        details: input.details,
        isActive: input.isActive ? 1 : 0,
        isSpecial: input.isSpecial,
        name: input.name,
        serviceCategoryId: category.id,
        slug,
        sortOrder,
        updatedByAdminId: actor.adminId,
      });

      await recordAdminAudit(
        {
          action: "catalog.services.create",
          adminId: actor.adminId,
          module: MODULE,
          newValues: {
            categoryId: category.id,
            description: row.description,
            detailsLength: input.details?.length ?? 0,
            isActive: row.isActive,
            isSpecial: row.isSpecial,
            name: row.name,
            slug: row.slug,
            sortOrder,
          },
          request: actor.request,
          subject: { id: row.id, type: SERVICE_SUBJECT },
        },
        transaction,
      );
      return row;
    });
    invalidateCatalogCache();
    return { id: created.id.toString() };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    rethrowPrisma(error);
  }
}

export async function updateAdminService(actor: Actor, id: string, input: ServiceUpdateInput): Promise<void> {
  try {
    await runInTransaction(async (transaction) => {
      const current = await requireService(transaction, id);

      let categoryId = current.serviceCategoryId;
      if (input.categoryId !== undefined && BigInt(input.categoryId) !== current.serviceCategoryId) {
        const category = await findCategoryById(transaction, BigInt(input.categoryId));
        if (!category) {
          throw new ApiError(400, API_ERROR_CODES.validationFailed, "دسته‌بندی انتخاب‌شده معتبر نیست.", {
            fields: { categoryId: ["دسته‌بندی انتخاب‌شده معتبر نیست."] },
          });
        }
        categoryId = category.id;
      }
      const movedCategory = categoryId !== current.serviceCategoryId;

      const name = input.name ?? current.name;
      if (name !== current.name || movedCategory) await assertServiceNameFree(transaction, categoryId, name, current.id);
      if (input.slug && input.slug !== current.slug) await assertServiceSlugFree(transaction, input.slug, current.id);

      const sortOrder =
        input.sortOrder ?? (movedCategory ? await nextServiceSortOrder(transaction, categoryId) : undefined);

      const data = {
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
        ...(input.isSpecial !== undefined ? { isSpecial: input.isSpecial } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(movedCategory ? { serviceCategoryId: categoryId } : {}),
      };
      const updated = await updateServiceRow(transaction, current.id, {
        ...data,
        ...(input.details !== undefined ? { details: input.details } : {}),
        updatedByAdminId: actor.adminId,
      });

      // The rich body is too large for the audit diff; record only that it changed.
      const changedKeys = Object.keys(data);
      const onlyStatus = input.isActive !== undefined && changedKeys.length === 1 && input.details === undefined;
      const onlySpecial = input.isSpecial !== undefined && changedKeys.length === 1 && input.details === undefined;
      await recordAdminAudit(
        {
          action: onlyStatus
            ? input.isActive
              ? "catalog.services.activate"
              : "catalog.services.deactivate"
            : onlySpecial
              ? input.isSpecial
                ? "catalog.services.feature"
                : "catalog.services.unfeature"
              : "catalog.services.update",
          adminId: actor.adminId,
          ...(input.details !== undefined
            ? { metadata: { detailsLength: input.details?.length ?? 0, detailsUpdated: true } }
            : {}),
          module: MODULE,
          newValues: pick(updated, changedKeys),
          oldValues: pick(current, changedKeys),
          request: actor.request,
          subject: { id: current.id, type: SERVICE_SUBJECT },
        },
        transaction,
      );
    });
    invalidateCatalogCache();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    rethrowPrisma(error);
  }
}

/**
 * Deleting is only for mistakes: a service that a provider offers or a farmer
 * requested must stay for history, so it is deactivated instead.
 */
export async function deleteAdminService(
  actor: Actor,
  id: string,
  storage: ObjectStorage = resolveImageStorage(SERVICE_IMAGE_PATH),
): Promise<void> {
  const removedImage = await runInTransaction(async (transaction) => {
    const current = await requireService(transaction, id);
    const references = await countServiceReferences(transaction, current.id);
    if (references.providerServices > 0 || references.requests > 0) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "این خدمت در پروفایل خدمات‌دهندگان یا درخواست‌ها استفاده شده و قابل حذف نیست؛ به جای حذف، آن را غیرفعال کنید.",
      );
    }
    await hardDeleteService(transaction, current.id);
    await recordAdminAudit(
      {
        action: "catalog.services.delete",
        adminId: actor.adminId,
        module: MODULE,
        oldValues: {
          categoryId: current.serviceCategoryId,
          image: current.image,
          isActive: current.isActive,
          name: current.name,
          slug: current.slug,
        },
        request: actor.request,
        subject: { id: current.id, type: SERVICE_SUBJECT },
      },
      transaction,
    );
    return current.image;
  });
  invalidateCatalogCache();
  await removeImageQuietly(storage, removedImage);
}

export async function reorderAdminServices(actor: Actor, categoryId: string, ids: string[]): Promise<void> {
  await runInTransaction(async (transaction) => {
    const live = new Set((await listLiveServiceIdsInCategory(transaction, BigInt(categoryId))).map(String));
    if (live.size === 0 || ids.length !== live.size || ids.some((id) => !live.has(id))) {
      throw new ApiError(409, API_ERROR_CODES.conflict, "فهرست خدمات این دسته تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.");
    }
    for (const [index, id] of ids.entries()) {
      await setServiceSortOrder(transaction, BigInt(id), index + 1);
    }
    await recordAdminAudit(
      {
        action: "catalog.services.reorder",
        adminId: actor.adminId,
        metadata: { categoryId, order: ids },
        module: MODULE,
        request: actor.request,
      },
      transaction,
    );
  });
  invalidateCatalogCache();
}

// =========================================================================== images

type ImageTarget = "category" | "service";

const IMAGE_TARGETS = {
  category: {
    find: (transaction: TransactionClient, id: string) => requireCategory(transaction, id),
    path: CATEGORY_IMAGE_PATH,
    prefix: "category",
    subject: CATEGORY_SUBJECT,
    update: (transaction: TransactionClient, id: bigint, image: string | null, adminId: bigint) =>
      updateCategoryRow(transaction, id, { image, updatedByAdminId: adminId }),
  },
  service: {
    find: (transaction: TransactionClient, id: string) => requireService(transaction, id),
    path: SERVICE_IMAGE_PATH,
    prefix: "service",
    subject: SERVICE_SUBJECT,
    update: (transaction: TransactionClient, id: bigint, image: string | null, adminId: bigint) =>
      updateServiceRow(transaction, id, { image, updatedByAdminId: adminId }),
  },
} as const;

export async function uploadCatalogImage(
  actor: Actor,
  target: ImageTarget,
  id: string,
  file: File,
  storage?: ObjectStorage,
): Promise<{ image: string }> {
  const config = IMAGE_TARGETS[target];
  const store = storage ?? resolveImageStorage(config.path);
  const image = await readValidatedImage(file);

  // Fail fast on a wrong id before writing anything to storage.
  await runInTransaction((transaction) => config.find(transaction, id));

  const key = `${config.prefix}-${createPublicId().toLowerCase()}${image.extension}`;
  const url = await putImage(store, { contentType: image.contentType, data: image.data, key });

  let previous: string | null;
  try {
    previous = await runInTransaction(async (transaction) => {
      const current = await config.find(transaction, id);
      await config.update(transaction, current.id, url, actor.adminId);
      await recordAdminAudit(
        {
          action: `catalog.${target === "category" ? "categories" : "services"}.image_upload`,
          adminId: actor.adminId,
          module: MODULE,
          newValues: { image: url },
          oldValues: { image: current.image },
          request: actor.request,
          subject: { id: current.id, type: config.subject },
        },
        transaction,
      );
      return current.image;
    });
  } catch (error) {
    await removeImageQuietly(store, url);
    throw error;
  }

  invalidateCatalogCache();
  await removeImageQuietly(store, previous);
  return { image: url };
}

export async function removeCatalogImage(
  actor: Actor,
  target: ImageTarget,
  id: string,
  storage?: ObjectStorage,
): Promise<void> {
  const config = IMAGE_TARGETS[target];
  const store = storage ?? resolveImageStorage(config.path);
  const previous = await runInTransaction(async (transaction) => {
    const current = await config.find(transaction, id);
    if (!current.image) return null;
    await config.update(transaction, current.id, null, actor.adminId);
    await recordAdminAudit(
      {
        action: `catalog.${target === "category" ? "categories" : "services"}.image_remove`,
        adminId: actor.adminId,
        module: MODULE,
        oldValues: { image: current.image },
        request: actor.request,
        subject: { id: current.id, type: config.subject },
      },
      transaction,
    );
    return current.image;
  });
  invalidateCatalogCache();
  await removeImageQuietly(store, previous);
}

// ========================================================================== helpers

function pick(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}

// ================================================================== content images

const CONTENT_IMAGE_PATH = "catalog/content";

/**
 * Stores a picture placed inside a service's intro text and returns its URL.
 * The file is not tied to a row: the document references it by URL, so a
 * picture removed from the text later is just an orphaned (harmless) file.
 */
export async function uploadServiceContentImage(
  actor: Actor,
  file: File,
  storage: ObjectStorage = resolveImageStorage(CONTENT_IMAGE_PATH),
): Promise<{ url: string }> {
  const image = await readValidatedImage(file);
  const key = `content-${createPublicId().toLowerCase()}${image.extension}`;
  const url = await putImage(storage, { contentType: image.contentType, data: image.data, key });
  await recordAdminAudit({
    action: "catalog.services.content_image_upload",
    adminId: actor.adminId,
    metadata: { bytes: image.data.byteLength, url },
    module: MODULE,
    request: actor.request,
  });
  return { url };
}
