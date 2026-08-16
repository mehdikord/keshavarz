import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";

export const CatalogSlugClientSchema = z
  .string()
  .trim()
  .min(1, "شناسه الزامی است.")
  .max(170)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "شناسه باید با حروف کوچک لاتین، عدد و خط تیره باشد.",
  );

export const AdminCategorySchema = z
  .object({
    categoryId: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullable(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    image: z.string().nullable(),
    isActive: z.boolean(),
    name: z.string(),
    sortOrder: z.number(),
    updatedAt: z.string(),
  })
  .strict();

export const AdminServiceSchema = z
  .object({
    category: z
      .object({
        categoryId: z.string(),
        name: z.string(),
      })
      .strict(),
    createdAt: z.string(),
    deletedAt: z.string().nullable(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    isActive: z.boolean(),
    name: z.string(),
    serviceId: z.string(),
    sortOrder: z.number(),
    updatedAt: z.string(),
  })
  .strict();

export const AdminCategoryFormSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(100).optional(),
  image: z.string().trim().max(512).optional(),
  isActive: z.boolean(),
  name: z.string().trim().min(1, "نام الزامی است.").max(150),
  slug: CatalogSlugClientSchema,
  sortOrder: z.coerce.number().int().min(0).max(65535),
});

export const AdminServiceFormSchema = z.object({
  categoryId: CatalogSlugClientSchema,
  description: z.string().trim().max(1000).optional(),
  image: z.string().trim().max(512).optional(),
  isActive: z.boolean(),
  name: z.string().trim().min(1, "نام الزامی است.").max(150),
  slug: CatalogSlugClientSchema,
  sortOrder: z.coerce.number().int().min(0).max(65535),
});

export type AdminCategory = z.infer<typeof AdminCategorySchema>;
export type AdminService = z.infer<typeof AdminServiceSchema>;
export type AdminCategoryFormValues = z.infer<typeof AdminCategoryFormSchema>;
export type AdminServiceFormValues = z.infer<typeof AdminServiceFormSchema>;

export async function fetchAdminCategories(input: {
  isActive?: "0" | "1";
  signal?: AbortSignal;
}): Promise<AdminCategory[]> {
  const result = await adminApi.get<{ categories: unknown[] }>(
    "/catalog/categories",
    {
      query: { isActive: input.isActive },
      signal: input.signal,
    },
  );
  return z.array(AdminCategorySchema).parse(result.data.categories);
}

export async function createAdminCategory(
  input: AdminCategoryFormValues,
): Promise<AdminCategory> {
  const result = await adminApi.post<unknown>("/catalog/categories", {
    description: input.description?.trim() || null,
    icon: input.icon?.trim() || null,
    image: input.image?.trim() || null,
    isActive: input.isActive,
    name: input.name.trim(),
    slug: input.slug.trim(),
    sortOrder: input.sortOrder,
  });
  return AdminCategorySchema.parse(result.data);
}

export async function patchAdminCategory(
  categoryId: string,
  input: Partial<AdminCategoryFormValues>,
): Promise<AdminCategory> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.slug !== undefined) body.slug = input.slug.trim();
  if (input.description !== undefined) {
    body.description = input.description.trim() || null;
  }
  if (input.icon !== undefined) body.icon = input.icon.trim() || null;
  if (input.image !== undefined) body.image = input.image.trim() || null;
  if (input.isActive !== undefined) body.isActive = input.isActive;
  if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder;

  const result = await adminApi.patch<unknown>(
    `/catalog/categories/${categoryId}`,
    body,
  );
  return AdminCategorySchema.parse(result.data);
}

export async function deleteAdminCategory(categoryId: string): Promise<void> {
  await adminApi.delete(`/catalog/categories/${categoryId}`);
}

export async function fetchAdminServices(input: {
  categoryId?: string;
  isActive?: "0" | "1";
  signal?: AbortSignal;
}): Promise<AdminService[]> {
  const result = await adminApi.get<{ services: unknown[] }>(
    "/catalog/services",
    {
      query: {
        categoryId: input.categoryId,
        isActive: input.isActive,
      },
      signal: input.signal,
    },
  );
  return z.array(AdminServiceSchema).parse(result.data.services);
}

export async function createAdminService(
  input: AdminServiceFormValues,
): Promise<AdminService> {
  const result = await adminApi.post<unknown>("/catalog/services", {
    categoryId: input.categoryId.trim(),
    description: input.description?.trim() || null,
    image: input.image?.trim() || null,
    isActive: input.isActive,
    name: input.name.trim(),
    slug: input.slug.trim(),
    sortOrder: input.sortOrder,
  });
  return AdminServiceSchema.parse(result.data);
}

export async function patchAdminService(
  serviceId: string,
  input: Partial<AdminServiceFormValues>,
): Promise<AdminService> {
  const body: Record<string, unknown> = {};
  if (input.categoryId !== undefined) body.categoryId = input.categoryId.trim();
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.slug !== undefined) body.slug = input.slug.trim();
  if (input.description !== undefined) {
    body.description = input.description.trim() || null;
  }
  if (input.image !== undefined) body.image = input.image.trim() || null;
  if (input.isActive !== undefined) body.isActive = input.isActive;
  if (input.sortOrder !== undefined) body.sortOrder = input.sortOrder;

  const result = await adminApi.patch<unknown>(
    `/catalog/services/${serviceId}`,
    body,
  );
  return AdminServiceSchema.parse(result.data);
}

export async function deleteAdminService(serviceId: string): Promise<void> {
  await adminApi.delete(`/catalog/services/${serviceId}`);
}

export async function reorderAdminCatalog(input: {
  categories?: Array<{ categoryId: string; sortOrder: number }>;
  services?: Array<{ serviceId: string; sortOrder: number }>;
}): Promise<{ categoriesUpdated: number; servicesUpdated: number }> {
  const result = await adminApi.post<{
    categoriesUpdated: number;
    servicesUpdated: number;
  }>("/catalog/reorder", input);
  return result.data;
}
