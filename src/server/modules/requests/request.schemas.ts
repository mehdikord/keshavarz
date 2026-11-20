import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";

export const RequestParamsSchema = z
  .object({
    requestId: PublicIdSchema,
  })
  .strict();

export const AddRequestProvidersSchema = z
  .object({
    providerIds: z.array(PublicIdSchema).min(1).max(30),
  })
  .strict();

export const ConsumerRequestsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  /** `open` = awaiting_send + pending_provider (the consumer's "waiting" tab). */
  status: z
    .enum([
      "open",
      "awaiting_send",
      "pending_provider",
      "in_progress",
      "completed",
      "cancelled",
    ])
    .optional(),
});

export const ProviderRequestsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  linkStatus: z
    .enum(["sent", "accepted", "rejected", "removed"])
    .optional(),
});

export const ExpectedVersionSchema = z
  .object({
    expectedVersion: z.number().int().positive().optional(),
  })
  .strict();

export const AcceptRequestSchema = ExpectedVersionSchema;

export const RejectRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive().optional(),
    reason: z.string().trim().max(1000).optional(),
  })
  .strict();

export const CancelRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive().optional(),
    reason: z.string().trim().min(3).max(1500).optional(),
  })
  .strict();

export const CompleteRequestSchema = ExpectedVersionSchema;

export const ViewRequestSchema = z.object({}).strict();

export const IdempotencyHeaderSchema = z
  .string()
  .min(16)
  .max(128)
  .regex(/^[A-Za-z0-9._~-]+$/);
