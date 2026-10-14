import * as z from "zod";

import { MoneyTomanSchema, PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";

export const PlanCodeSchema = CatalogSlugSchema.or(
  z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
);

export const AdminSubscriptionPlansQuerySchema = z
  .object({
    includeDeleted: z
      .enum(["0", "1", "true", "false"])
      .optional()
      .transform((value) => value === "1" || value === "true"),
    isActive: z
      .enum(["0", "1"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : (Number(value) as 0 | 1),
      ),
  })
  .strict();

export const AdminPlanParamsSchema = z
  .object({
    planId: PlanCodeSchema,
  })
  .strict();

export const AdminCreateSubscriptionPlanSchema = z
  .object({
    code: PlanCodeSchema,
    description: z.string().trim().max(1000).nullable().optional(),
    durationMonths: z.number().int().min(1).max(36),
    features: z.unknown().optional(),
    isActive: z.boolean().optional().default(true),
    isRecommended: z.boolean().optional().default(false),
    name: z.string().trim().min(1).max(150),
    priceToman: MoneyTomanSchema.min(0),
    sortOrder: z.number().int().min(0).max(65535).optional().default(0),
  })
  .strict();

export const AdminUpdateSubscriptionPlanSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    durationMonths: z.number().int().min(1).max(36).optional(),
    features: z.unknown().optional(),
    isActive: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    priceToman: MoneyTomanSchema.min(0).optional(),
    sortOrder: z.number().int().min(0).max(65535).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminProviderSubscriptionsQuerySchema =
  createCursorPaginationSchema(["createdAt"] as const).extend({
    providerId: PublicIdSchema.optional(),
    status: z
      .enum(["pending", "active", "expired", "cancelled"])
      .optional(),
  });

export const AdminPaymentsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  status: z
    .enum([
      "initiated",
      "pending",
      "paid",
      "failed",
      "cancelled",
      "partially_refunded",
      "refunded",
    ])
    .optional(),
  userId: PublicIdSchema.optional(),
});

export const AdminPaymentParamsSchema = z
  .object({
    paymentId: PublicIdSchema,
  })
  .strict();

export const AdminRefundsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  status: z
    .enum(["requested", "processing", "succeeded", "failed", "cancelled"])
    .optional(),
});
