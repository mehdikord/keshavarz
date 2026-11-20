import * as z from "zod";

export const REQUEST_STATUSES = ["awaiting_send", "pending_provider", "in_progress", "completed", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const OPEN_STATUSES: readonly RequestStatus[] = ["awaiting_send", "pending_provider", "in_progress"];

export const REQUEST_LIST_SORTS = ["newest", "oldest", "updated", "price"] as const;
export const REQUEST_LIST_PERIODS = ["all", "today", "7d", "30d", "90d"] as const;
export const REQUEST_LIST_PAGE_SIZES = [10, 20, 50, 100] as const;

const PUBLIC_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/** `c:<id>` filters by category, `s:<id>` by one service. */
const ServiceFilterSchema = z.string().regex(/^[cs]:[1-9]\d{0,18}$/);

/** List filters come straight from the URL, so every field falls back to its default. */
export const RequestsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  period: z.enum(REQUEST_LIST_PERIODS).catch("all"),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (REQUEST_LIST_PAGE_SIZES as readonly number[]).includes(value))
    .catch(20),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => toLatinDigits(value))
    .optional()
    .catch(undefined),
  service: ServiceFilterSchema.optional().catch(undefined),
  sort: z.enum(REQUEST_LIST_SORTS).catch("newest"),
  status: z.enum(["all", ...REQUEST_STATUSES]).catch("all"),
});
export type RequestsListQuery = z.infer<typeof RequestsListQuerySchema>;

export const RequestParamsSchema = z.object({
  requestId: z.string().regex(PUBLIC_ID, "شناسه درخواست معتبر نیست."),
});

export const RequestLinkParamsSchema = RequestParamsSchema.extend({
  linkId: z.string().regex(/^[1-9]\d{0,18}$/, "شناسه دعوت معتبر نیست."),
});

const ReasonSchema = z
  .string()
  .trim()
  .min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.")
  .max(1500, "دلیل طولانی‌تر از حد مجاز است.");

export const RequestCancelSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    reason: ReasonSchema,
  })
  .strict();

export const RequestCompleteSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    reason: ReasonSchema,
  })
  .strict();

export const RequestWithdrawSchema = z
  .object({
    reason: ReasonSchema,
  })
  .strict();
