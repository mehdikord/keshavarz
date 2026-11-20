import * as z from "zod";

export const CATALOG_STATUSES = ["all", "active", "inactive"] as const;
export type CatalogStatusFilter = (typeof CATALOG_STATUSES)[number];

export const SERVICE_LIST_SORTS = ["order", "name", "newest", "popular"] as const;
export const SERVICE_LIST_PAGE_SIZES = [10, 20, 50, 100] as const;

const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/** Internal row id, carried as a string so bigint survives JSON. */
const RowIdSchema = z.string().regex(/^[1-9]\d{0,18}$/, "شناسه معتبر نیست.");

export const CategoryIdParamsSchema = z.object({ categoryId: RowIdSchema });
export const ServiceIdParamsSchema = z.object({ serviceId: RowIdSchema });

/** The latin key used in app URLs and API payloads (`serviceId` / `categoryId`). */
export const CatalogSlugInputSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, "شناسه لاتین حداکثر ۱۲۰ نویسه است.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه لاتین فقط حروف کوچک انگلیسی، عدد و خط تیره (-) می‌پذیرد.");

const NameSchema = z
  .string()
  .trim()
  .min(2, "نام باید حداقل ۲ حرف باشد.")
  .max(150, "نام حداکثر ۱۵۰ نویسه است.");

const DescriptionSchema = z
  .string()
  .trim()
  .max(1000, "توضیحات حداکثر ۱۰۰۰ نویسه است.")
  .nullable()
  .transform((value) => (value ? value : null));

const SortOrderSchema = z.coerce.number().int("ترتیب باید عدد صحیح باشد.").min(0, "ترتیب نمی‌تواند منفی باشد.").max(65_535);

/** Empty string means "generate one for me". */
const OptionalSlugSchema = z
  .union([z.literal(""), CatalogSlugInputSchema])
  .optional()
  .transform((value) => (value ? value : undefined));

export const CategoryCreateSchema = z
  .object({
    description: DescriptionSchema.optional().default(null),
    isActive: z.boolean().default(true),
    name: NameSchema,
    slug: OptionalSlugSchema,
    sortOrder: SortOrderSchema.optional(),
  })
  .strict();
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;

export const CategoryUpdateSchema = z
  .object({
    description: DescriptionSchema.optional(),
    isActive: z.boolean().optional(),
    name: NameSchema.optional(),
    slug: CatalogSlugInputSchema.optional(),
    sortOrder: SortOrderSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "هیچ تغییری ارسال نشده است." });
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;

export const ServiceCreateSchema = z
  .object({
    categoryId: RowIdSchema,
    description: DescriptionSchema.optional().default(null),
    isActive: z.boolean().default(true),
    name: NameSchema,
    slug: OptionalSlugSchema,
    sortOrder: SortOrderSchema.optional(),
  })
  .strict();
export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;

export const ServiceUpdateSchema = z
  .object({
    categoryId: RowIdSchema.optional(),
    description: DescriptionSchema.optional(),
    isActive: z.boolean().optional(),
    name: NameSchema.optional(),
    slug: CatalogSlugInputSchema.optional(),
    sortOrder: SortOrderSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "هیچ تغییری ارسال نشده است." });
export type ServiceUpdateInput = z.infer<typeof ServiceUpdateSchema>;

/** Full new order of a sibling list: categories, or the services of one category. */
export const CategoryReorderSchema = z
  .object({ ids: z.array(RowIdSchema).min(1).max(500) })
  .strict()
  .refine((value) => new Set(value.ids).size === value.ids.length, { message: "شناسه تکراری در ترتیب ارسالی است." });

export const ServiceReorderSchema = z
  .object({ categoryId: RowIdSchema, ids: z.array(RowIdSchema).min(1).max(500) })
  .strict()
  .refine((value) => new Set(value.ids).size === value.ids.length, { message: "شناسه تکراری در ترتیب ارسالی است." });

/** URL-driven filters fall back to defaults instead of failing the page. */
export const ServicesListQuerySchema = z.object({
  category: RowIdSchema.optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (SERVICE_LIST_PAGE_SIZES as readonly number[]).includes(value))
    .catch(20),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => toLatinDigits(value))
    .optional()
    .catch(undefined),
  sort: z.enum(SERVICE_LIST_SORTS).catch("order"),
  status: z.enum(CATALOG_STATUSES).catch("all"),
});
export type ServicesListQuery = z.infer<typeof ServicesListQuerySchema>;

export const CategoriesListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(CATALOG_STATUSES).catch("all"),
});
export type CategoriesListQuery = z.infer<typeof CategoriesListQuerySchema>;
