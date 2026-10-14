import * as z from "zod";

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from "@/server/contracts/constants";

export const PublicIdSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه عمومی معتبر نیست.")
  .brand<"PublicId">();

export const RequestIdSchema = PublicIdSchema.brand<"RequestId">();

export const IsoUtcDateTimeSchema = z
  .string()
  .datetime({
    offset: false,
    message: "زمان باید ISO 8601 و UTC باشد.",
  });

export const MoneyTomanSchema = z
  .number()
  .int("مبلغ باید عدد صحیح تومان باشد.")
  .nonnegative("مبلغ نمی‌تواند منفی باشد.")
  .safe("مبلغ خارج از محدوده امن عددی است.");

export const DecimalStringSchema = z
  .string()
  .regex(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/, "مقدار Decimal معتبر نیست.");

export const ErrorCodeSchema = z
  .string()
  .regex(/^[A-Z][A-Z0-9_]*$/, "کد خطا معتبر نیست.");

export const ApiFieldErrorsSchema = z.record(
  z.string(),
  z.array(z.string().min(1, "پیام خطا نمی‌تواند خالی باشد.")).min(1),
);

export const ApiErrorSchema = z
  .object({
    code: ErrorCodeSchema,
    message: z.string().min(1, "پیام خطا الزامی است."),
    fields: ApiFieldErrorsSchema.optional(),
  })
  .strict();

export const ApiErrorEnvelopeSchema = z
  .object({
    error: ApiErrorSchema,
    requestId: RequestIdSchema,
  })
  .strict();

export const ApiSuccessEnvelopeSchema = z
  .object({
    data: z.unknown(),
    meta: z.record(z.string(), z.unknown()).optional(),
    requestId: RequestIdSchema,
  })
  .strict();

export const CursorPaginationQuerySchema = z
  .object({
    cursor: z.string().min(1).max(512).optional(),
    limit: z
      .number()
      .int()
      .min(1)
      .max(PAGINATION_MAX_LIMIT)
      .default(PAGINATION_DEFAULT_LIMIT),
    sort: z.string().min(1).max(64).optional(),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const CursorPaginationMetaSchema = z
  .object({
    nextCursor: z.string().min(1).max(512).nullable(),
    hasMore: z.boolean(),
    limit: z.number().int().min(1).max(PAGINATION_MAX_LIMIT),
  })
  .strict();

export const IdempotencyKeySchema = z
  .string()
  .min(16, "کلید idempotency حداقل ۱۶ کاراکتر است.")
  .max(128, "کلید idempotency حداکثر ۱۲۸ کاراکتر است.")
  .regex(
    /^[A-Za-z0-9._~-]+$/,
    "کلید idempotency فقط می‌تواند URL-safe باشد.",
  )
  .brand<"IdempotencyKey">();

export const StrongEtagSchema = z
  .string()
  .regex(/^"[A-Za-z0-9_-]{16,}"$/, "ETag قوی معتبر نیست.")
  .brand<"StrongEtag">();
