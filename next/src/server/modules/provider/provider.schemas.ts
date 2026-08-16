import * as z from "zod";

import { DecimalStringSchema, MoneyTomanSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";

const LatitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -90 && number <= 90;
}, "عرض جغرافیایی باید بین ۹۰- و ۹۰ باشد.");

const LongitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -180 && number <= 180;
}, "طول جغرافیایی باید بین ۱۸۰- و ۱۸۰ باشد.");

export const ProviderProfileUpsertSchema = z
  .object({
    bio: z.string().trim().max(1000).nullable().optional(),
  })
  .strict();

export const ProviderWorkAreaSchema = z
  .object({
    isAvailable: z.boolean().optional(),
    workLatitude: LatitudeSchema.nullable().optional(),
    workLongitude: LongitudeSchema.nullable().optional(),
    workRadiusKm: z.number().int().min(20).max(100).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasLat = value.workLatitude !== undefined;
    const hasLng = value.workLongitude !== undefined;
    if (hasLat !== hasLng) {
      context.addIssue({
        code: "custom",
        message: "مرکز کار باید هر دو مختصات یا هر دو null باشد.",
        path: ["workLatitude"],
      });
      return;
    }
    if (
      hasLat &&
      value.workLatitude === null &&
      value.workLongitude !== null
    ) {
      context.addIssue({
        code: "custom",
        message: "مرکز کار باید هر دو مختصات یا هر دو null باشد.",
        path: ["workLongitude"],
      });
    }
    if (
      hasLat &&
      value.workLatitude !== null &&
      value.workLongitude === null
    ) {
      context.addIssue({
        code: "custom",
        message: "مرکز کار باید هر دو مختصات یا هر دو null باشد.",
        path: ["workLongitude"],
      });
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const PricingUnitSchema = z.enum([
  "fixed",
  "per_hectare",
  "per_square_meter",
  "per_hour",
  "per_day",
]);

export const ProviderServiceCreateSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    priceToman: MoneyTomanSchema.min(1000, "حداقل قیمت ۱۰۰۰ تومان است."),
    pricingUnit: PricingUnitSchema.default("fixed"),
    serviceId: CatalogSlugSchema,
  })
  .strict();

export const ProviderServiceUpdateSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    priceToman: MoneyTomanSchema.min(1000, "حداقل قیمت ۱۰۰۰ تومان است.").optional(),
    pricingUnit: PricingUnitSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const ProviderServiceParamsSchema = z
  .object({
    providerServiceId: CatalogSlugSchema,
  })
  .strict();

export const ProviderServicesQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const);
