import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";
import {
  APP_IDEMPOTENCY_HEADER,
  createAppIdempotencyKey,
} from "@/lib/api/app-idempotency";

export const AppSubscriptionPlanSchema = z
  .object({
    code: z.string(),
    description: z.string().nullable(),
    durationMonths: z.number().int(),
    features: z.unknown().nullable(),
    isRecommended: z.boolean(),
    name: z.string(),
    planId: z.string(),
    priceToman: z.number().int(),
    sortOrder: z.number().int(),
  })
  .strict();

export type AppSubscriptionPlan = z.infer<typeof AppSubscriptionPlanSchema>;

export const AppActiveSubscriptionSchema = z
  .object({
    amountToman: z.number().int(),
    endsAt: z.string().nullable(),
    planName: z.string(),
    remainingSeconds: z.number().int(),
    source: z.string(),
    startsAt: z.string().nullable(),
    status: z.string(),
    subscriptionId: z.string(),
  })
  .strict();

export type AppActiveSubscription = z.infer<typeof AppActiveSubscriptionSchema>;

export const AppSubscriptionHistoryItemSchema = z
  .object({
    amountToman: z.number().int(),
    cancelledAt: z.string().nullable(),
    createdAt: z.string(),
    endsAt: z.string().nullable(),
    planName: z.string(),
    source: z.string(),
    startsAt: z.string().nullable(),
    status: z.string(),
    subscriptionId: z.string(),
  })
  .strict();

export type AppSubscriptionHistoryItem = z.infer<
  typeof AppSubscriptionHistoryItemSchema
>;

export const AppPurchaseResultSchema = z
  .object({
    authority: z.string(),
    paymentId: z.string(),
    redirectUrl: z.string(),
    subscriptionId: z.string(),
  })
  .strict();

export type AppPurchaseResult = z.infer<typeof AppPurchaseResultSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export function isAppSubscriptionActive(
  subscription: AppActiveSubscription | null | undefined,
): boolean {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  return subscription.remainingSeconds > 0;
}

export async function fetchAppSubscriptionPlans(
  signal?: AbortSignal,
): Promise<AppSubscriptionPlan[]> {
  const result = await appApi.get<unknown>("/subscription/plans", { signal });
  return z
    .object({ plans: z.array(AppSubscriptionPlanSchema) })
    .parse(result.data).plans;
}

export async function fetchAppProviderSubscription(
  signal?: AbortSignal,
): Promise<AppActiveSubscription | null> {
  const result = await appApi.get<unknown>("/provider/subscription", { signal });
  return z
    .object({ subscription: AppActiveSubscriptionSchema.nullable() })
    .parse(result.data).subscription;
}

export async function fetchAppProviderSubscriptions(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
}): Promise<{ items: AppSubscriptionHistoryItem[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 20;
  const result = await appApi.get<unknown>("/provider/subscriptions", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
    },
    signal: input?.signal,
  });
  const data = z
    .object({ subscriptions: z.array(AppSubscriptionHistoryItemSchema) })
    .parse(result.data);
  return {
    items: data.subscriptions,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function purchaseAppProviderSubscription(input: {
  planCode: string;
  idempotencyKey?: string;
}): Promise<AppPurchaseResult> {
  const result = await appApi.post<unknown>(
    "/provider/subscriptions/purchase",
    { planCode: input.planCode },
    {
      extraHeaders: {
        [APP_IDEMPOTENCY_HEADER]:
          input.idempotencyKey ?? createAppIdempotencyKey("purchase"),
      },
    },
  );
  return AppPurchaseResultSchema.parse(result.data);
}
