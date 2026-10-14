import * as z from "zod";

import {
  IdempotencyKeySchema,
  MoneyTomanSchema,
  PublicIdSchema,
} from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";

export const SubscriptionPlansQuerySchema = z.object({}).strict();

export const SubscriptionsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const);

export const PaymentsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const);

export const PurchaseSubscriptionSchema = z
  .object({
    planCode: CatalogSlugSchema.or(
      z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    ),
  })
  .strict();

export const PaymentParamsSchema = z
  .object({
    paymentId: PublicIdSchema,
  })
  .strict();

export const GatewayParamsSchema = z
  .object({
    gateway: z.enum(["mock"]),
  })
  .strict();

export const PaymentCallbackSchema = z
  .object({
    amountToman: MoneyTomanSchema.positive(),
    authority: z.string().min(8).max(191),
    signature: z.string().min(32).max(128),
  })
  .strict();

export const PaymentVerifySchema = z.object({}).strict();

export const IdempotencyHeaderSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._~-]+$/);

export const AdminGrantSubscriptionSchema = z
  .object({
    durationMonths: z.number().int().min(1).max(36).optional(),
    planCode: z.string().min(1).max(100),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict();

export const AdminCancelSubscriptionSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export const AdminRefundSchema = z
  .object({
    amountToman: MoneyTomanSchema.positive(),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();

export const ProviderParamsSchema = z
  .object({
    providerId: PublicIdSchema,
  })
  .strict();

export const SubscriptionParamsSchema = z
  .object({
    subscriptionId: PublicIdSchema,
  })
  .strict();

export { IdempotencyKeySchema };
