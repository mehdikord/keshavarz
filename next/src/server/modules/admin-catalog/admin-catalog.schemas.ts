import * as z from "zod";

import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";

export const AdminCatalogCategoriesQuerySchema = z
  .object({
    isActive: z
      .enum(["0", "1"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : (Number(value) as 0 | 1),
      ),
  })
  .strict();

export const AdminCatalogServicesQuerySchema = z
  .object({
    categoryId: CatalogSlugSchema.optional(),
    isActive: z
      .enum(["0", "1"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : (Number(value) as 0 | 1),
      ),
  })
  .strict();

export const AdminCategoryParamsSchema = z
  .object({
    categoryId: CatalogSlugSchema,
  })
  .strict();

export const AdminServiceParamsSchema = z
  .object({
    serviceId: CatalogSlugSchema,
  })
  .strict();

export const AdminCategoryCreateSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    icon: z.string().trim().max(100).nullable().optional(),
    image: z.string().trim().max(512).nullable().optional(),
    isActive: z.boolean().optional().default(true),
    name: z.string().trim().min(1).max(150),
    slug: CatalogSlugSchema,
    sortOrder: z.number().int().min(0).max(65535).optional().default(0),
  })
  .strict();

export const AdminCategoryUpdateSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    icon: z.string().trim().max(100).nullable().optional(),
    image: z.string().trim().max(512).nullable().optional(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    slug: CatalogSlugSchema.optional(),
    sortOrder: z.number().int().min(0).max(65535).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminServiceCreateSchema = z
  .object({
    categoryId: CatalogSlugSchema,
    description: z.string().trim().max(1000).nullable().optional(),
    image: z.string().trim().max(512).nullable().optional(),
    isActive: z.boolean().optional().default(true),
    name: z.string().trim().min(1).max(150),
    slug: CatalogSlugSchema,
    sortOrder: z.number().int().min(0).max(65535).optional().default(0),
  })
  .strict();

export const AdminServiceUpdateSchema = z
  .object({
    categoryId: CatalogSlugSchema.optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    image: z.string().trim().max(512).nullable().optional(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    slug: CatalogSlugSchema.optional(),
    sortOrder: z.number().int().min(0).max(65535).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminCatalogReorderSchema = z
  .object({
    categories: z
      .array(
        z
          .object({
            categoryId: CatalogSlugSchema,
            sortOrder: z.number().int().min(0).max(65535),
          })
          .strict(),
      )
      .max(200)
      .optional(),
    services: z
      .array(
        z
          .object({
            serviceId: CatalogSlugSchema,
            sortOrder: z.number().int().min(0).max(65535),
          })
          .strict(),
      )
      .max(500)
      .optional(),
  })
  .strict()
  .refine(
    (value) =>
      (value.categories?.length ?? 0) > 0 || (value.services?.length ?? 0) > 0,
    {
      message: "حداقل یک مورد برای مرتب‌سازی لازم است.",
    },
  );
