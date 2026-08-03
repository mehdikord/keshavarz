import { z } from "zod";

const geoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const landFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "عنوان زمین باید حداقل ۲ کاراکتر باشد")
    .max(100, "عنوان زمین نباید بیشتر از ۱۰۰ کاراکتر باشد"),
  areaSqm: z
    .number()
    .int("متراژ باید عدد صحیح باشد")
    .positive("متراژ باید بیشتر از صفر باشد"),
  location: geoLocationSchema,
  description: z
    .string()
    .trim()
    .max(500, "توضیحات نباید بیشتر از ۵۰۰ کاراکتر باشد")
    .optional(),
});

export type LandFormValues = z.infer<typeof landFormSchema>;

export { geoLocationSchema };
