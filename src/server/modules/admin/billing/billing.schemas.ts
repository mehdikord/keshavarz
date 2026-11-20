import * as z from "zod";

const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

const PublicIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه معتبر نیست.");
const RowIdSchema = z.string().regex(/^[1-9]\d{0,18}$/, "شناسه معتبر نیست.");

const ReasonSchema = z
  .string()
  .trim()
  .min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.")
  .max(500, "دلیل حداکثر ۵۰۰ نویسه است.");

const SearchSchema = z
  .string()
  .trim()
  .max(100)
  .transform((value) => toLatinDigits(value))
  .optional()
  .catch(undefined);

export const BILLING_PAGE_SIZES = [10, 20, 50, 100] as const;
const PageSchema = z.coerce.number().int().min(1).max(100_000).catch(1);
const PerPageSchema = z.coerce
  .number()
  .int()
  .refine((value) => (BILLING_PAGE_SIZES as readonly number[]).includes(value))
  .catch(20);

// ------------------------------------------------------------ subscriptions

export const SUBSCRIPTION_STATUSES = ["pending", "active", "expired", "cancelled"] as const;
export const SUBSCRIPTION_SOURCES = ["purchase", "admin_grant", "promotion"] as const;

export const SubscriptionsListQuerySchema = z.object({
  page: PageSchema,
  perPage: PerPageSchema,
  plan: RowIdSchema.optional().catch(undefined),
  q: SearchSchema,
  source: z.enum(["all", ...SUBSCRIPTION_SOURCES]).catch("all"),
  status: z.enum(["all", ...SUBSCRIPTION_STATUSES]).catch("all"),
});
export type SubscriptionsListQuery = z.infer<typeof SubscriptionsListQuerySchema>;

export const SubscriptionParamsSchema = z.object({ subscriptionId: PublicIdSchema });

/** A length of time: whole months or days, never both. */
const DurationSchema = z.object({
  amount: z.coerce.number().int("مدت باید عدد صحیح باشد.").min(1, "مدت باید دست‌کم ۱ باشد.").max(1000),
  unit: z.enum(["days", "months"]),
});
export type BillingDuration = z.infer<typeof DurationSchema>;

export const SubscriptionGrantSchema = z
  .object({
    /** `null`: the plan's own duration. */
    duration: DurationSchema.nullable().default(null),
    planId: RowIdSchema,
    providerUserId: PublicIdSchema,
    reason: ReasonSchema,
  })
  .strict()
  .refine(
    (value) => !value.duration || (value.duration.unit === "months" ? value.duration.amount <= 36 : value.duration.amount <= 1000),
    { message: "مدت اعطا حداکثر ۳۶ ماه (۱۰۰۰ روز) است.", path: ["duration"] },
  );
export type SubscriptionGrantInput = z.infer<typeof SubscriptionGrantSchema>;

export const SubscriptionExtendSchema = z
  .object({ duration: DurationSchema, reason: ReasonSchema })
  .strict()
  .refine((value) => (value.duration.unit === "months" ? value.duration.amount <= 36 : value.duration.amount <= 1000), {
    message: "تمدید حداکثر ۳۶ ماه (۱۰۰۰ روز) است.",
    path: ["duration"],
  });
export type SubscriptionExtendInput = z.infer<typeof SubscriptionExtendSchema>;

export const SubscriptionCancelSchema = z.object({ reason: ReasonSchema }).strict();

export const ProviderLookupQuerySchema = z.object({ q: SearchSchema });

// -------------------------------------------------------------------- plans

export const PlanParamsSchema = z.object({ planId: RowIdSchema });

const PlanFieldsSchema = {
  description: z
    .string()
    .trim()
    .max(1000, "توضیحات حداکثر ۱۰۰۰ نویسه است.")
    .nullable()
    .transform((value) => (value ? value : null)),
  durationMonths: z.coerce.number().int("مدت باید عدد صحیح باشد.").min(1, "مدت دست‌کم ۱ ماه است.").max(36, "مدت حداکثر ۳۶ ماه است."),
  features: z
    .array(z.string().trim().min(1).max(120, "هر ویژگی حداکثر ۱۲۰ نویسه است."))
    .max(12, "حداکثر ۱۲ ویژگی.")
    .transform((items) => items.filter(Boolean)),
  isActive: z.boolean(),
  isRecommended: z.boolean(),
  name: z.string().trim().min(2, "نام پلن باید دست‌کم ۲ حرف باشد.").max(150, "نام پلن حداکثر ۱۵۰ نویسه است."),
  priceToman: z.coerce
    .number()
    .int("قیمت باید عدد صحیح باشد.")
    .min(1000, "قیمت دست‌کم ۱٬۰۰۰ تومان است.")
    .max(10_000_000_000, "قیمت بیش از حد مجاز است."),
  sortOrder: z.coerce.number().int().min(0).max(65_535),
};

export const PlanCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toLowerCase()
      .min(2, "کد پلن دست‌کم ۲ نویسه است.")
      .max(80, "کد پلن حداکثر ۸۰ نویسه است.")
      .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "کد پلن فقط حروف کوچک انگلیسی، عدد، - و _ می‌پذیرد."),
    description: PlanFieldsSchema.description.optional().default(null),
    durationMonths: PlanFieldsSchema.durationMonths,
    features: PlanFieldsSchema.features.default([]),
    isActive: PlanFieldsSchema.isActive.default(true),
    isRecommended: PlanFieldsSchema.isRecommended.default(false),
    name: PlanFieldsSchema.name,
    priceToman: PlanFieldsSchema.priceToman,
    sortOrder: PlanFieldsSchema.sortOrder.optional(),
  })
  .strict();
export type PlanCreateInput = z.infer<typeof PlanCreateSchema>;

/** The code is the plan's key in the provider app's purchase API, so it never changes. */
export const PlanUpdateSchema = z
  .object({
    description: PlanFieldsSchema.description.optional(),
    durationMonths: PlanFieldsSchema.durationMonths.optional(),
    features: PlanFieldsSchema.features.optional(),
    isActive: PlanFieldsSchema.isActive.optional(),
    isRecommended: PlanFieldsSchema.isRecommended.optional(),
    name: PlanFieldsSchema.name.optional(),
    priceToman: PlanFieldsSchema.priceToman.optional(),
    sortOrder: PlanFieldsSchema.sortOrder.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: "هیچ تغییری ارسال نشده است." });
export type PlanUpdateInput = z.infer<typeof PlanUpdateSchema>;

export const PlanReorderSchema = z
  .object({ ids: z.array(RowIdSchema).min(1).max(200) })
  .strict()
  .refine((value) => new Set(value.ids).size === value.ids.length, { message: "شناسه تکراری در ترتیب ارسالی است." });

// ----------------------------------------------------------------- payments

export const PAYMENT_STATUSES = ["initiated", "pending", "paid", "failed", "cancelled", "partially_refunded", "refunded"] as const;
export const PAYMENT_PERIODS = ["all", "today", "7d", "30d", "90d", "365d"] as const;
export type PaymentPeriod = (typeof PAYMENT_PERIODS)[number];

export const PaymentsListQuerySchema = z.object({
  page: PageSchema,
  perPage: PerPageSchema,
  period: z.enum(PAYMENT_PERIODS).catch("all"),
  q: SearchSchema,
  /** `refunds`: anything refunded in part or in full. */
  status: z.enum(["all", "paid", "open", "failed", "refunds"]).catch("all"),
});
export type PaymentsListQuery = z.infer<typeof PaymentsListQuerySchema>;

export const PaymentParamsSchema = z.object({ paymentId: PublicIdSchema });

export const PaymentRefundSchema = z
  .object({
    amountToman: z.coerce.number().int("مبلغ باید عدد صحیح باشد.").min(1, "مبلغ باید بیشتر از صفر باشد."),
    cancelSubscription: z.boolean().default(false),
    reason: ReasonSchema,
  })
  .strict();
export type PaymentRefundInput = z.infer<typeof PaymentRefundSchema>;
