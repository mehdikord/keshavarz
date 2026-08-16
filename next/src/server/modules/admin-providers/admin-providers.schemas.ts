import * as z from "zod";

import {
  DecimalStringSchema,
  MoneyTomanSchema,
  PublicIdSchema,
} from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { PricingUnitSchema } from "@/server/modules/provider/provider.schemas";

const LatitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -90 && number <= 90;
}, "عرض جغرافیایی باید بین ۹۰- و ۹۰ باشد.");

const LongitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -180 && number <= 180;
}, "طول جغرافیایی باید بین ۱۸۰- و ۱۸۰ باشد.");

export const AdminProvidersQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  approved: z.enum(["yes", "no"]).optional(),
  isActive: z
    .enum(["0", "1"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : (Number(value) as 0 | 1),
    ),
  isAvailable: z
    .enum(["0", "1"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : (Number(value) as 0 | 1),
    ),
  q: z.string().trim().min(1).max(120).optional(),
});

export const AdminProviderParamsSchema = z
  .object({
    providerId: PublicIdSchema,
  })
  .strict();

export const AdminProviderUpdateSchema = z
  .object({
    bio: z.string().trim().max(1000).nullable().optional(),
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
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminProviderApproveSchema = z
  .object({
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const AdminProviderAvailabilitySchema = z
  .object({
    isActive: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.isActive !== undefined || value.isAvailable !== undefined,
    {
      message: "حداقل یکی از isAvailable یا isActive لازم است.",
    },
  );

export const AdminProviderServiceParamsSchema = z
  .object({
    providerServiceId: z
      .string()
      .regex(/^\d+$/, "شناسه خدمت Provider معتبر نیست."),
  })
  .strict();

export const AdminProviderServiceUpdateSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    isActive: z.boolean().optional(),
    priceToman: MoneyTomanSchema.min(1000, "حداقل قیمت ۱۰۰۰ تومان است.").optional(),
    pricingUnit: PricingUnitSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminProviderServicesQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const);
