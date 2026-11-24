import { parseStoredRichDoc, type RichDoc } from "@/lib/rich-content/rich-content";
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
  findVisibleServiceIntroBySlug,
  listVisibleSiblingServices,
  listVisibleSpecialServices,
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

// ------------------------------------------------------------- featured / intro

export interface FeaturedService {
  category: { categoryId: string; name: string };
  description: string | null;
  image: string | null;
  name: string;
  serviceId: string;
}

async function getSpecialServicePool(): Promise<FeaturedService[]> {
  const cacheKey = "special-services";
  const cached = getCatalogCache<FeaturedService[]>(cacheKey);
  if (cached) return cached;
  const pool = (await listVisibleSpecialServices()).map((row) => ({
    category: { categoryId: row.category.slug, name: row.category.name },
    description: row.description,
    image: row.image,
    name: row.name,
    serviceId: row.slug,
  }));
  setCatalogCache(cacheKey, pool);
  return pool;
}

/**
 * `count` random picks from the services an admin marked special. The pool is
 * cached (it changes only when an admin edits the catalog); the draw is fresh
 * on every call. `exclude` lets the client ask for a different set.
 */
export async function drawFeaturedServices(
  count: number,
  exclude: readonly string[] = [],
  random: () => number = Math.random,
): Promise<FeaturedService[]> {
  const pool = await getSpecialServicePool();
  const skip = new Set(exclude);
  const shuffle = <T,>(items: T[]): T[] => {
    const out = [...items];
    for (let index = out.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [out[index], out[swap]] = [out[swap]!, out[index]!];
    }
    return out;
  };
  // Services not shown last time come first; the rest only fill up a small pool.
  const fresh = shuffle(pool.filter((service) => !skip.has(service.serviceId)));
  const seen = shuffle(pool.filter((service) => skip.has(service.serviceId)));
  return shuffle([...fresh, ...seen].slice(0, count));
}

export interface ServiceIntro {
  category: { categoryId: string; image: string | null; name: string };
  description: string | null;
  details: RichDoc | null;
  image: string | null;
  isSpecial: boolean;
  name: string;
  related: Array<{ image: string | null; name: string; serviceId: string }>;
  serviceId: string;
  updatedAt: string;
}

/** Everything the public intro page shows; `null` when the service is not visible. */
export async function getServiceIntro(serviceSlug: string): Promise<ServiceIntro | null> {
  const cacheKey = `service-intro:${serviceSlug}`;
  const cached = getCatalogCache<ServiceIntro | "missing">(cacheKey);
  if (cached) return cached === "missing" ? null : cached;

  const row = await findVisibleServiceIntroBySlug(serviceSlug);
  if (!row) {
    setCatalogCache(cacheKey, "missing");
    return null;
  }
  const related = await listVisibleSiblingServices(row.category.slug, row.slug, 6);
  const intro: ServiceIntro = {
    category: { categoryId: row.category.slug, image: row.category.image, name: row.category.name },
    description: row.description,
    details: parseStoredRichDoc(row.details),
    image: row.image,
    isSpecial: row.isSpecial,
    name: row.name,
    related: related.map((service) => ({ image: service.image, name: service.name, serviceId: service.slug })),
    serviceId: row.slug,
    updatedAt: row.updatedAt.toISOString(),
  };
  setCatalogCache(cacheKey, intro);
  return intro;
}
