import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type {
  CatalogStatusFilter,
  ServicesListQuery,
} from "@/server/modules/admin/catalog/catalog-admin.schemas";

type Db = TransactionClient | typeof prisma;

/** `slug` is an ASCII column: comparing it with Persian text is a MySQL error, not a miss. */
const isAscii = (value: string) => /^[\x20-\x7e]+$/.test(value);

function categorySearch(q?: string): Prisma.ServiceCategoryWhereInput {
  if (!q) return {};
  return {
    OR: [{ name: { contains: q } }, ...(isAscii(q) ? [{ slug: { contains: q.toLowerCase() } }] : [])],
  };
}

function statusWhere(status: CatalogStatusFilter): { isActive?: number } {
  if (status === "active") return { isActive: 1 };
  if (status === "inactive") return { isActive: 0 };
  return {};
}

// --------------------------------------------------------------- categories

const CATEGORY_SELECT = {
  createdAt: true,
  description: true,
  id: true,
  image: true,
  isActive: true,
  name: true,
  slug: true,
  sortOrder: true,
  updatedAt: true,
} as const;

export async function listCategoryRows(filters: { q?: string; status: CatalogStatusFilter }) {
  return prisma.serviceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: CATEGORY_SELECT,
    where: {
      deletedAt: null,
      ...statusWhere(filters.status),
      ...categorySearch(filters.q),
    },
  });
}

export async function countCategoriesPerStatus(q?: string) {
  const rows = await prisma.serviceCategory.groupBy({
    _count: { _all: true },
    by: ["isActive"],
    where: { deletedAt: null, ...categorySearch(q) },
  });
  const active = rows.find((row) => row.isActive === 1)?._count._all ?? 0;
  const inactive = rows.find((row) => row.isActive === 0)?._count._all ?? 0;
  return { active, all: active + inactive, inactive };
}

/** Non-deleted service counts per category, split by status. */
export async function countServicesPerCategory(categoryIds: bigint[]) {
  if (categoryIds.length === 0) return [];
  return prisma.service.groupBy({
    _count: { _all: true },
    by: ["serviceCategoryId", "isActive"],
    where: { deletedAt: null, serviceCategoryId: { in: categoryIds } },
  });
}

/** Service-request totals per category (key: category id as string). */
export async function countRequestsPerCategory(categoryIds: bigint[]) {
  const totals = new Map<string, number>();
  if (categoryIds.length === 0) return totals;
  const perService = await prisma.serviceRequest.groupBy({
    _count: { _all: true },
    by: ["serviceId"],
    where: { service: { serviceCategoryId: { in: categoryIds } } },
  });
  if (perService.length === 0) return totals;
  const services = await prisma.service.findMany({
    select: { id: true, serviceCategoryId: true },
    where: { id: { in: perService.map((row) => row.serviceId) } },
  });
  const categoryOf = new Map(services.map((row) => [row.id.toString(), row.serviceCategoryId.toString()]));
  for (const row of perService) {
    const categoryId = categoryOf.get(row.serviceId.toString());
    if (categoryId) totals.set(categoryId, (totals.get(categoryId) ?? 0) + row._count._all);
  }
  return totals;
}

export async function findCategoryById(db: Db, id: bigint) {
  return db.serviceCategory.findFirst({ select: CATEGORY_SELECT, where: { deletedAt: null, id } });
}

export async function findCategoryIdBySlug(db: Db, slug: string) {
  return db.serviceCategory.findUnique({ select: { deletedAt: true, id: true }, where: { slug } });
}

export async function nextCategorySortOrder(db: Db) {
  const row = await db.serviceCategory.aggregate({ _max: { sortOrder: true }, where: { deletedAt: null } });
  return Math.min(65_535, (row._max.sortOrder ?? 0) + 1);
}

export async function insertCategory(db: Db, data: Prisma.ServiceCategoryUncheckedCreateInput) {
  return db.serviceCategory.create({ data, select: CATEGORY_SELECT });
}

export async function updateCategoryRow(db: Db, id: bigint, data: Prisma.ServiceCategoryUncheckedUpdateInput) {
  return db.serviceCategory.update({ data: { ...data, updatedAt: new Date() }, select: CATEGORY_SELECT, where: { id } });
}

export async function countServicesInCategory(db: Db, categoryId: bigint) {
  const [live, total] = await Promise.all([
    db.service.count({ where: { deletedAt: null, serviceCategoryId: categoryId } }),
    db.service.count({ where: { serviceCategoryId: categoryId } }),
  ]);
  return { live, total };
}

export async function hardDeleteCategory(db: Db, id: bigint) {
  await db.serviceCategory.delete({ where: { id } });
}

export async function listCategoryOptions() {
  return prisma.serviceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true, isActive: true, name: true },
    where: { deletedAt: null },
  });
}

export async function listLiveCategoryIds(db: Db) {
  const rows = await db.serviceCategory.findMany({ select: { id: true }, where: { deletedAt: null } });
  return rows.map((row) => row.id);
}

// ----------------------------------------------------------------- services

const SERVICE_SELECT = {
  category: { select: { id: true, isActive: true, name: true } },
  createdAt: true,
  description: true,
  id: true,
  image: true,
  isActive: true,
  name: true,
  serviceCategoryId: true,
  slug: true,
  sortOrder: true,
  updatedAt: true,
} as const;

function serviceFilters(query: Pick<ServicesListQuery, "category" | "q">): Prisma.ServiceWhereInput {
  return {
    category: { deletedAt: null },
    deletedAt: null,
    ...(query.category ? { serviceCategoryId: BigInt(query.category) } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q } },
            { description: { contains: query.q } },
            ...(isAscii(query.q) ? [{ slug: { contains: query.q.toLowerCase() } }] : []),
          ],
        }
      : {}),
  };
}

function serviceOrder(sort: ServicesListQuery["sort"]): Prisma.ServiceOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ name: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "popular":
      return [{ serviceRequests: { _count: "desc" } }, { id: "asc" }];
    default:
      return [{ category: { sortOrder: "asc" } }, { serviceCategoryId: "asc" }, { sortOrder: "asc" }, { id: "asc" }];
  }
}

export async function listServiceRows(query: ServicesListQuery) {
  const where = { ...serviceFilters(query), ...statusWhere(query.status) };
  const [rows, total] = await Promise.all([
    prisma.service.findMany({
      orderBy: serviceOrder(query.sort),
      select: {
        ...SERVICE_SELECT,
        _count: {
          select: {
            providerServices: { where: { isActive: 1 } },
            serviceRequests: true,
          },
        },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.service.count({ where }),
  ]);
  return { rows, total };
}

export async function countServicesPerStatus(query: Pick<ServicesListQuery, "category" | "q">) {
  const rows = await prisma.service.groupBy({
    _count: { _all: true },
    by: ["isActive"],
    where: serviceFilters(query),
  });
  const active = rows.find((row) => row.isActive === 1)?._count._all ?? 0;
  const inactive = rows.find((row) => row.isActive === 0)?._count._all ?? 0;
  return { active, all: active + inactive, inactive };
}

export async function findServiceById(db: Db, id: bigint) {
  return db.service.findFirst({ select: SERVICE_SELECT, where: { deletedAt: null, id } });
}

export async function findServiceIdBySlug(db: Db, slug: string) {
  return db.service.findUnique({ select: { id: true }, where: { slug } });
}

export async function findServiceIdByName(db: Db, categoryId: bigint, name: string) {
  return db.service.findFirst({ select: { id: true }, where: { name, serviceCategoryId: categoryId } });
}

export async function nextServiceSortOrder(db: Db, categoryId: bigint) {
  const row = await db.service.aggregate({
    _max: { sortOrder: true },
    where: { deletedAt: null, serviceCategoryId: categoryId },
  });
  return Math.min(65_535, (row._max.sortOrder ?? 0) + 1);
}

export async function insertService(db: Db, data: Prisma.ServiceUncheckedCreateInput) {
  return db.service.create({ data, select: SERVICE_SELECT });
}

export async function updateServiceRow(db: Db, id: bigint, data: Prisma.ServiceUncheckedUpdateInput) {
  return db.service.update({ data: { ...data, updatedAt: new Date() }, select: SERVICE_SELECT, where: { id } });
}

export async function countServiceReferences(db: Db, serviceId: bigint) {
  const [providerServices, requests] = await Promise.all([
    db.providerService.count({ where: { serviceId } }),
    db.serviceRequest.count({ where: { serviceId } }),
  ]);
  return { providerServices, requests };
}

export async function hardDeleteService(db: Db, id: bigint) {
  await db.service.delete({ where: { id } });
}

export async function listLiveServiceIdsInCategory(db: Db, categoryId: bigint) {
  const rows = await db.service.findMany({
    select: { id: true },
    where: { deletedAt: null, serviceCategoryId: categoryId },
  });
  return rows.map((row) => row.id);
}

export async function setCategorySortOrder(db: Db, id: bigint, sortOrder: number) {
  await db.serviceCategory.update({ data: { sortOrder }, where: { id } });
}

export async function setServiceSortOrder(db: Db, id: bigint, sortOrder: number) {
  await db.service.update({ data: { sortOrder }, where: { id } });
}
