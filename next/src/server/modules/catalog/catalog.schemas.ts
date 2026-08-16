import * as z from "zod";

export const CatalogSlugSchema = z
  .string()
  .min(1)
  .max(170)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه کاتالوگ معتبر نیست.");

export const CategoryParamsSchema = z
  .object({
    categoryId: CatalogSlugSchema,
  })
  .strict();

export const ServiceParamsSchema = z
  .object({
    serviceId: CatalogSlugSchema,
  })
  .strict();
