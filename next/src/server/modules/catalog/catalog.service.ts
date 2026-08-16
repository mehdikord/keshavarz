import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  getCatalogCache,
  setCatalogCache,
} from "@/server/modules/catalog/catalog.cache";
import {
  mapCategory,
  mapService,
} from "@/server/modules/catalog/catalog.mapper";
import {
  findActiveCategoryBySlug,
  findActiveServiceBySlug,
  listActiveCategories,
  listActiveServicesByCategoryId,
} from "@/server/modules/catalog/catalog.repository";

export async function getCatalogCategories() {
  const cacheKey = "categories";
  const cached = getCatalogCache<ReturnType<typeof mapCategory>[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const categories = (await listActiveCategories()).map(mapCategory);
  setCatalogCache(cacheKey, categories);
  return categories;
}

export async function getCatalogCategoryServices(categorySlug: string) {
  const cacheKey = `category-services:${categorySlug}`;
  const cached = getCatalogCache<ReturnType<typeof mapService>[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const category = await findActiveCategoryBySlug(categorySlug);
  if (!category) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "دسته یافت نشد.");
  }

  const services = (await listActiveServicesByCategoryId(category.id)).map(
    mapService,
  );
  setCatalogCache(cacheKey, services);
  return services;
}

export async function getCatalogService(serviceSlug: string) {
  const cacheKey = `service:${serviceSlug}`;
  const cached = getCatalogCache<ReturnType<typeof mapService>>(cacheKey);
  if (cached) {
    return cached;
  }

  const service = await findActiveServiceBySlug(serviceSlug);
  if (!service) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت یافت نشد.");
  }

  const mapped = mapService(service);
  setCatalogCache(cacheKey, mapped);
  return mapped;
}
