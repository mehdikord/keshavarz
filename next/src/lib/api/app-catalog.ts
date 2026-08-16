import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

export const AppCategorySchema = z
  .object({
    categoryId: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    image: z.string().nullable(),
    name: z.string(),
    sortOrder: z.number().int(),
  })
  .strict();

export const AppServiceSchema = z
  .object({
    category: z
      .object({
        categoryId: z.string(),
        name: z.string(),
      })
      .strict()
      .optional(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    name: z.string(),
    serviceId: z.string(),
    sortOrder: z.number().int(),
  })
  .strict();

export type AppCategory = z.infer<typeof AppCategorySchema>;
export type AppService = z.infer<typeof AppServiceSchema>;

export async function fetchAppCategories(
  signal?: AbortSignal,
): Promise<AppCategory[]> {
  const result = await appApi.get<unknown>("/catalog/categories", { signal });
  return z
    .object({ categories: z.array(AppCategorySchema) })
    .parse(result.data).categories;
}

export async function fetchAppCategoryServices(
  categoryId: string,
  signal?: AbortSignal,
): Promise<AppService[]> {
  const result = await appApi.get<unknown>(
    `/catalog/categories/${encodeURIComponent(categoryId)}/services`,
    { signal },
  );
  return z.object({ services: z.array(AppServiceSchema) }).parse(result.data)
    .services;
}

export async function fetchAppService(
  serviceId: string,
  signal?: AbortSignal,
): Promise<AppService> {
  const result = await appApi.get<unknown>(
    `/catalog/services/${encodeURIComponent(serviceId)}`,
    { signal },
  );
  return AppServiceSchema.parse(result.data);
}

/** Load categories with nested services for UI selects (matches prior mock shape). */
export async function fetchAppCatalogTree(signal?: AbortSignal): Promise<
  Array<AppCategory & { services: AppService[] }>
> {
  const categories = await fetchAppCategories(signal);
  const withServices = await Promise.all(
    categories.map(async (category) => ({
      ...category,
      services: await fetchAppCategoryServices(category.categoryId, signal),
    })),
  );
  return withServices;
}
