import * as z from "zod";

import { DecimalStringSchema, PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";

export const LandParamsSchema = z
  .object({
    landId: PublicIdSchema,
  })
  .strict();

export const LandsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const);

const LatitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -90 && number <= 90;
}, "عرض جغرافیایی باید بین ۹۰- و ۹۰ باشد.");

const LongitudeSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return number >= -180 && number <= 180;
}, "طول جغرافیایی باید بین ۱۸۰- و ۱۸۰ باشد.");

const AreaSchema = DecimalStringSchema.refine((value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
}, "مساحت باید عدد مثبت باشد.");

export const LandCreateSchema = z
  .object({
    areaSquareMeters: AreaSchema,
    description: z.string().trim().max(1500).nullable().optional(),
    latitude: LatitudeSchema,
    longitude: LongitudeSchema,
    title: z.string().trim().min(2).max(150),
  })
  .strict();

export const LandUpdateSchema = z
  .object({
    areaSquareMeters: AreaSchema.optional(),
    description: z.string().trim().max(1500).nullable().optional(),
    latitude: LatitudeSchema.optional(),
    longitude: LongitudeSchema.optional(),
    title: z.string().trim().min(2).max(150).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });
