import * as z from "zod";

/** `any` rather than `all`: the shared StatusTabs drops `status=all` from the URL, and the default here is `active`. */
export const PROVIDER_TABS = ["active", "eligible", "inactive", "unavailable", "no_subscription", "any"] as const;
export type ProviderTab = (typeof PROVIDER_TABS)[number];

export const PROVIDER_LIST_SORTS = ["newest", "oldest", "name", "services"] as const;
export const PROVIDER_LIST_PAGE_SIZES = [10, 20, 50, 100] as const;

export const PRICING_UNITS = ["fixed", "per_hectare", "per_square_meter", "per_hour", "per_day"] as const;

/** Same bounds as the provider app (provider.schemas.ts / patchCurrentProviderWorkArea). */
export const MIN_WORK_RADIUS_KM = 20;
export const MAX_WORK_RADIUS_KM = 100;
export const MIN_SERVICE_PRICE_TOMAN = 1000;

const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

const RowIdSchema = z.string().regex(/^[1-9]\d{0,18}$/, "شناسه معتبر نیست.");
const PublicIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه خدمات‌دهنده معتبر نیست.");

export const ProviderParamsSchema = z.object({ providerId: PublicIdSchema });
export const ProviderServiceParamsSchema = ProviderParamsSchema.extend({ providerServiceId: RowIdSchema });
export const ProviderGalleryParamsSchema = ProviderParamsSchema.extend({ imageId: PublicIdSchema });

/** URL-driven filters fall back to defaults instead of failing the page. */
export const ProvidersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (PROVIDER_LIST_PAGE_SIZES as readonly number[]).includes(value))
    .catch(20),
  province: z.coerce.number().int().positive().optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => toLatinDigits(value))
    .optional()
    .catch(undefined),
  service: RowIdSchema.optional().catch(undefined),
  sort: z.enum(PROVIDER_LIST_SORTS).catch("newest"),
  status: z.enum(PROVIDER_TABS).catch("active"),
});
export type ProvidersListQuery = z.infer<typeof ProvidersListQuerySchema>;

export const ProviderProfileUpdateSchema = z
  .object({
    bio: z
      .string()
      .trim()
      .max(1000, "معرفی حداکثر ۱۰۰۰ نویسه است.")
      .nullable()
      .transform((value) => (value ? value : null))
      .optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "هیچ تغییری ارسال نشده است." });
export type ProviderProfileUpdateInput = z.infer<typeof ProviderProfileUpdateSchema>;

export const ProviderStatusSchema = z
  .object({
    isActive: z.boolean(),
    reason: z
      .string()
      .trim()
      .min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.")
      .max(500, "دلیل طولانی‌تر از حد مجاز است."),
  })
  .strict();
export type ProviderStatusInput = z.infer<typeof ProviderStatusSchema>;

export const ProviderApprovalSchema = z.object({ approved: z.boolean() }).strict();

const Coordinate = (min: number, max: number, message: string) =>
  z.coerce.number({ error: message }).min(min, message).max(max, message);

/** Both coordinates set, or both null to clear the work area. */
export const ProviderWorkAreaSchema = z
  .object({
    workLatitude: Coordinate(-90, 90, "عرض جغرافیایی باید بین ۹۰- و ۹۰ باشد.").nullable(),
    workLongitude: Coordinate(-180, 180, "طول جغرافیایی باید بین ۱۸۰- و ۱۸۰ باشد.").nullable(),
    workRadiusKm: z.coerce
      .number()
      .int("شعاع باید عدد صحیح باشد.")
      .min(MIN_WORK_RADIUS_KM, `شعاع کاری باید بین ${MIN_WORK_RADIUS_KM} تا ${MAX_WORK_RADIUS_KM} کیلومتر باشد.`)
      .max(MAX_WORK_RADIUS_KM, `شعاع کاری باید بین ${MIN_WORK_RADIUS_KM} تا ${MAX_WORK_RADIUS_KM} کیلومتر باشد.`),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.workLatitude === null) !== (value.workLongitude === null)) {
      context.addIssue({
        code: "custom",
        message: "عرض و طول جغرافیایی باید با هم ثبت یا با هم حذف شوند.",
        path: [value.workLatitude === null ? "workLatitude" : "workLongitude"],
      });
    }
  });
export type ProviderWorkAreaInput = z.infer<typeof ProviderWorkAreaSchema>;

const PriceSchema = z.coerce
  .number({ error: "قیمت معتبر نیست." })
  .int("قیمت باید عدد صحیح تومان باشد.")
  .min(MIN_SERVICE_PRICE_TOMAN, "حداقل قیمت ۱۰۰۰ تومان است.")
  .max(Number.MAX_SAFE_INTEGER, "قیمت بیش از حد بزرگ است.");

const ServiceDescriptionSchema = z
  .string()
  .trim()
  .max(1000, "توضیحات حداکثر ۱۰۰۰ نویسه است.")
  .nullable()
  .transform((value) => (value ? value : null));

export const ProviderServiceCreateSchema = z
  .object({
    description: ServiceDescriptionSchema.optional().default(null),
    priceToman: PriceSchema,
    pricingUnit: z.enum(PRICING_UNITS).default("fixed"),
    serviceId: RowIdSchema,
  })
  .strict();
export type ProviderServiceCreateInput = z.infer<typeof ProviderServiceCreateSchema>;

export const ProviderServiceUpdateSchema = z
  .object({
    description: ServiceDescriptionSchema.optional(),
    isActive: z.boolean().optional(),
    priceToman: PriceSchema.optional(),
    pricingUnit: z.enum(PRICING_UNITS).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "هیچ تغییری ارسال نشده است." });
export type ProviderServiceUpdateInput = z.infer<typeof ProviderServiceUpdateSchema>;
