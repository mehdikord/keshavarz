import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { adminApi } from "@/lib/api/admin-client";
import {
  ADMIN_IDEMPOTENCY_HEADER,
  createAdminIdempotencyKey,
} from "@/lib/api/admin-idempotency";

export const PAYMENT_STATUSES = [
  "initiated",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "partially_refunded",
  "refunded",
] as const;

export const REFUND_STATUSES = [
  "requested",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export type AdminPaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type AdminRefundStatus = (typeof REFUND_STATUSES)[number];

export const AdminPaymentListItemSchema = z
  .object({
    amountToman: z.number(),
    createdAt: z.string(),
    gateway: z.string(),
    paidAt: z.string().nullable(),
    paymentId: z.string(),
    status: z.string(),
    subscriptionId: z.string().nullable(),
    userId: z.string(),
  })
  .strict();

export const AdminPaymentRefundItemSchema = z
  .object({
    amountToman: z.number(),
    createdAt: z.string(),
    reason: z.string(),
    refundId: z.string(),
    status: z.string(),
  })
  .strict();

export const AdminPaymentDetailSchema = AdminPaymentListItemSchema.extend({
  authority: z.string().nullable(),
  failedAt: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  refunds: z.array(AdminPaymentRefundItemSchema),
  subscriptionStatus: z.string().nullable(),
  transactionReference: z.string().nullable(),
}).strict();

export const AdminRefundListItemSchema = z
  .object({
    amountToman: z.number(),
    createdAt: z.string(),
    paymentId: z.string(),
    processedAt: z.string().nullable(),
    reason: z.string(),
    refundId: z.string(),
    requestedByAdminId: z.string().nullable(),
    status: z.string(),
  })
  .strict();

export type AdminPaymentListItem = z.infer<typeof AdminPaymentListItemSchema>;
export type AdminPaymentDetail = z.infer<typeof AdminPaymentDetailSchema>;
export type AdminRefundListItem = z.infer<typeof AdminRefundListItemSchema>;

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

export async function fetchAdminPayments(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
  status?: AdminPaymentStatus;
  userId?: string;
}): Promise<{ items: AdminPaymentListItem[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ payments: unknown[] }>("/payments", {
    query: {
      cursor: input.cursor || undefined,
      limit: input.limit,
      status: input.status,
      userId: input.userId || undefined,
    },
    signal: input.signal,
  });
  return {
    items: z.array(AdminPaymentListItemSchema).parse(result.data.payments),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function fetchAdminPayment(
  paymentId: string,
  signal?: AbortSignal,
): Promise<AdminPaymentDetail> {
  const result = await adminApi.get<unknown>(`/payments/${paymentId}`, {
    signal,
  });
  return AdminPaymentDetailSchema.parse(result.data);
}

export async function createAdminPaymentRefund(
  paymentId: string,
  input: { amountToman: number; reason: string },
): Promise<{
  paymentId: string;
  paymentStatus: string;
  refund: {
    amountToman: number;
    createdAt: string;
    reason: string;
    refundId: string;
    status: string;
  };
}> {
  const result = await adminApi.post<{
    paymentId: string;
    paymentStatus: string;
    refund: {
      amountToman: number;
      createdAt: string;
      reason: string;
      refundId: string;
      status: string;
    };
  }>(`/payments/${paymentId}/refunds`, input, {
    headers: {
      [ADMIN_IDEMPOTENCY_HEADER]: createAdminIdempotencyKey("refund"),
    },
  });
  return result.data;
}

export async function fetchAdminRefunds(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
  status?: AdminRefundStatus;
}): Promise<{ items: AdminRefundListItem[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ refunds: unknown[] }>("/refunds", {
    query: {
      cursor: input.cursor || undefined,
      limit: input.limit,
      status: input.status,
    },
    signal: input.signal,
  });
  return {
    items: z.array(AdminRefundListItemSchema).parse(result.data.refunds),
    meta: CursorMetaSchema.parse(result.meta),
  };
}
