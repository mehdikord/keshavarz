import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";

export const AppPaymentSummarySchema = z
  .object({
    amountToman: z.number().int(),
    createdAt: z.string(),
    gateway: z.string(),
    paidAt: z.string().nullable(),
    paymentId: z.string(),
    status: z.string(),
    subscriptionId: z.string().nullable(),
  })
  .strict();

export type AppPaymentSummary = z.infer<typeof AppPaymentSummarySchema>;

export const AppPaymentDetailSchema = AppPaymentSummarySchema.extend({
  authority: z.string().nullable(),
  failedAt: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  subscriptionStatus: z.string().nullable(),
  transactionReference: z.string().nullable(),
}).strict();

export type AppPaymentDetail = z.infer<typeof AppPaymentDetailSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export async function fetchAppPayments(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
}): Promise<{ items: AppPaymentSummary[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 20;
  const result = await appApi.get<unknown>("/payments", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
    },
    signal: input?.signal,
  });
  const data = z
    .object({ payments: z.array(AppPaymentSummarySchema) })
    .parse(result.data);
  return {
    items: data.payments,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function fetchAppPayment(
  paymentId: string,
  signal?: AbortSignal,
): Promise<AppPaymentDetail> {
  const result = await appApi.get<unknown>(`/payments/${paymentId}`, { signal });
  return AppPaymentDetailSchema.parse(result.data);
}

export async function verifyAppPayment(
  paymentId: string,
): Promise<AppPaymentDetail> {
  const result = await appApi.post<unknown>(`/payments/${paymentId}/verify`, {});
  return AppPaymentDetailSchema.parse(result.data);
}
