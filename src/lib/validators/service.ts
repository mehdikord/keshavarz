import { z } from "zod";

import { geoLocationSchema } from "@/lib/validators/land";

export const offeredServiceSchema = z.object({
  serviceId: z.string().min(1, "خدمت را انتخاب کنید"),
  price: z
    .number()
    .int("قیمت باید عدد صحیح باشد")
    .min(0, "قیمت نمی‌تواند منفی باشد"),
});

export const workAreaSchema = z.object({
  workCenter: geoLocationSchema,
  workRadiusKm: z
    .number()
    .int("محدوده باید عدد صحیح باشد")
    .min(20, "حداقل محدوده ۲۰ کیلومتر است")
    .max(100, "حداکثر محدوده ۱۰۰ کیلومتر است"),
});

export type OfferedServiceFormValues = z.infer<typeof offeredServiceSchema>;
export type WorkAreaFormValues = z.infer<typeof workAreaSchema>;
