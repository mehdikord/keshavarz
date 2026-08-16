import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ باید به صورت YYYY-MM-DD باشد.");

export const CreateServiceSearchSchema = z
  .object({
    categoryId: CatalogSlugSchema.optional(),
    consumerNote: z.string().trim().max(1500).nullable().optional(),
    dates: z
      .array(DateOnlySchema)
      .min(1, "حداقل یک تاریخ لازم است.")
      .max(31, "تعداد تاریخ‌ها بیش از حد مجاز است."),
    landId: PublicIdSchema,
    serviceId: CatalogSlugSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    const unique = new Set(value.dates);
    if (unique.size !== value.dates.length) {
      ctx.addIssue({
        code: "custom",
        message: "تاریخ‌ها نباید تکراری باشند.",
        path: ["dates"],
      });
    }
  });

export const SearchParamsSchema = z
  .object({
    searchId: PublicIdSchema,
  })
  .strict();

export const SearchProvidersQuerySchema = createCursorPaginationSchema([
  "distanceAsc",
  "distanceDesc",
  "priceAsc",
  "priceDesc",
] as const);

export const IdempotencyHeaderSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._~-]+$/);
