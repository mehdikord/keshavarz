import { systemClock } from "@/server/clock/clock";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import {
  mapAdminCategory,
  mapAdminService,
} from "@/server/modules/admin-catalog/admin-catalog.mapper";
import {
  countNonDeletedServicesInCategory,
  countProviderServicesForCategory,
  countProviderServicesForService,
  countServiceRequestsForCategory,
  countServiceRequestsForService,
  createAdminCategory,
  createAdminService,
  findAdminCategoryBySlug,
  findAdminServiceBySlug,
  listAdminCategories,
  listAdminServices,
  reorderAdminCatalog,
  softDeleteAdminCategory,
  softDeleteAdminService,
  updateAdminCategory,
  updateAdminService,
} from "@/server/modules/admin-catalog/admin-catalog.repository";
import { invalidateCatalogCache } from "@/server/modules/catalog/catalog.cache";

function throwMappedPrisma(error: unknown): never {
  const mapped = mapPrismaError(error);
  if (mapped) {
    throw mapped;
  }
  throw error;
}

export async function listCategoriesForAdmin(input: { isActive?: 0 | 1 }) {
  const categories = await listAdminCategories(input);
  return categories.map(mapAdminCategory);
}

export async function createCategoryForAdmin(input: {
  adminId: bigint;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  isActive: boolean;
  name: string;
  slug: string;
  sortOrder: number;
}) {
  try {
    const created = await createAdminCategory(input);
    invalidateCatalogCache();
    return {
      categoryId: created.id,
      newValues: mapAdminCategory(created),
    };
  } catch (error) {
    throwMappedPrisma(error);
  }
}

export async function updateCategoryForAdmin(
  categoryId: string,
  adminId: bigint,
  input: {
    description?: string | null;
    icon?: string | null;
    image?: string | null;
    isActive?: boolean;
    name?: string;
    slug?: string;
    sortOrder?: number;
  },
) {
  const existing = await findAdminCategoryBySlug(categoryId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
  }

  try {
    const updated = await updateAdminCategory(existing.id, adminId, {
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.isActive === undefined
        ? {}
        : { isActive: input.isActive ? 1 : 0 }),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    });
    invalidateCatalogCache();
    return {
      categoryId: existing.id,
      newValues: mapAdminCategory(updated),
      oldValues: mapAdminCategory(existing),
    };
  } catch (error) {
    throwMappedPrisma(error);
  }
}

export async function deleteCategoryForAdmin(
  categoryId: string,
  adminId: bigint,
) {
  const existing = await findAdminCategoryBySlug(categoryId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
  }

  const [activeServices, providerServices, serviceRequests] = await Promise.all(
    [
      countNonDeletedServicesInCategory(existing.id),
      countProviderServicesForCategory(existing.id),
      countServiceRequestsForCategory(existing.id),
    ],
  );

  if (activeServices > 0) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "دسته دارای خدمت فعال است و قابل حذف نیست.",
    );
  }

  if (providerServices > 0 || serviceRequests > 0) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "دسته دارای سابقه خدمت Provider یا درخواست است و قابل حذف نیست.",
    );
  }

  const deleted = await softDeleteAdminCategory(
    existing.id,
    adminId,
    systemClock.now(),
  );
  invalidateCatalogCache();
  return {
    categoryId: existing.id,
    oldValues: mapAdminCategory(existing),
    newValues: mapAdminCategory(deleted),
  };
}

export async function listServicesForAdmin(input: {
  categoryId?: string;
  isActive?: 0 | 1;
}) {
  let categoryInternalId: bigint | undefined;
  if (input.categoryId) {
    const category = await findAdminCategoryBySlug(input.categoryId);
    if (!category) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
    }
    categoryInternalId = category.id;
  }

  const services = await listAdminServices({
    categoryId: categoryInternalId,
    isActive: input.isActive,
  });
  return services.map(mapAdminService);
}

export async function createServiceForAdmin(input: {
  adminId: bigint;
  categoryId: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  name: string;
  slug: string;
  sortOrder: number;
}) {
  const category = await findAdminCategoryBySlug(input.categoryId);
  if (!category) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
  }

  try {
    const created = await createAdminService({
      adminId: input.adminId,
      description: input.description,
      image: input.image,
      isActive: input.isActive,
      name: input.name,
      serviceCategoryId: category.id,
      slug: input.slug,
      sortOrder: input.sortOrder,
    });
    invalidateCatalogCache();
    return {
      newValues: mapAdminService(created),
      serviceId: created.id,
    };
  } catch (error) {
    throwMappedPrisma(error);
  }
}

export async function updateServiceForAdmin(
  serviceId: string,
  adminId: bigint,
  input: {
    categoryId?: string;
    description?: string | null;
    image?: string | null;
    isActive?: boolean;
    name?: string;
    slug?: string;
    sortOrder?: number;
  },
) {
  const existing = await findAdminServiceBySlug(serviceId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
  }

  let serviceCategoryId: bigint | undefined;
  if (input.categoryId !== undefined) {
    const category = await findAdminCategoryBySlug(input.categoryId);
    if (!category) {
      throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
    }
    serviceCategoryId = category.id;
  }

  try {
    const updated = await updateAdminService(existing.id, adminId, {
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.image !== undefined ? { image: input.image } : {}),
      ...(input.isActive === undefined
        ? {}
        : { isActive: input.isActive ? 1 : 0 }),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(serviceCategoryId !== undefined ? { serviceCategoryId } : {}),
    });
    invalidateCatalogCache();
    return {
      newValues: mapAdminService(updated),
      oldValues: mapAdminService(existing),
      serviceId: existing.id,
    };
  } catch (error) {
    throwMappedPrisma(error);
  }
}

export async function deleteServiceForAdmin(
  serviceId: string,
  adminId: bigint,
) {
  const existing = await findAdminServiceBySlug(serviceId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
  }

  const [providerServices, serviceRequests] = await Promise.all([
    countProviderServicesForService(existing.id),
    countServiceRequestsForService(existing.id),
  ]);

  if (providerServices > 0 || serviceRequests > 0) {
    throw new ApiError(
      409,
      API_ERROR_CODES.conflict,
      "خدمت دارای سابقه Provider یا درخواست است و قابل حذف نیست.",
    );
  }

  const deleted = await softDeleteAdminService(
    existing.id,
    adminId,
    systemClock.now(),
  );
  invalidateCatalogCache();
  return {
    newValues: mapAdminService(deleted),
    oldValues: mapAdminService(existing),
    serviceId: existing.id,
  };
}

export async function reorderCatalogForAdmin(input: {
  adminId: bigint;
  categories?: Array<{ categoryId: string; sortOrder: number }>;
  services?: Array<{ serviceId: string; sortOrder: number }>;
}) {
  const result = await runInTransaction(async (transaction) =>
    reorderAdminCatalog(transaction, input),
  );

  if (result.kind === "missing_category") {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "دسته یافت نشد.",
      { fields: { categoryId: [result.categoryId] } },
    );
  }
  if (result.kind === "missing_service") {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "خدمت یافت نشد.",
      { fields: { serviceId: [result.serviceId] } },
    );
  }

  invalidateCatalogCache();
  return {
    categoriesUpdated: input.categories?.length ?? 0,
    servicesUpdated: input.services?.length ?? 0,
  };
}
