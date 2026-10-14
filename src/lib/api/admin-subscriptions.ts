import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { adminApi } from "@/lib/api/admin-client";
import {
  ADMIN_IDEMPOTENCY_HEADER,
  createAdminIdempotencyKey,
} from "@/lib/api/admin-idempotency";

export const PlanCodeClientSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "کد پلن باید با حروف کوچک لاتین، عدد و خط تیره باشد.",
  );

export const AdminSubscriptionPlanSchema = z
  .object({
    code: z.string(),
    createdAt: z.string(),
    deletedAt: z.string().nullable(),
    description: z.string().nullable(),
    durationMonths: z.number(),
    features: z.unknown().nullable(),
    isActive: z.boolean(),
    isRecommended: z.boolean(),
    name: z.string(),
    planId: z.string(),
    priceToman: z.number(),
    sortOrder: z.number(),
    updatedAt: z.string(),
  })
  .strict();

export const AdminPlanFormSchema = z.object({
  code: PlanCodeClientSchema,
  description: z.string().trim().max(1000).optional(),
  durationMonths: z.coerce.number().int().min(1).max(36),
  featuresText: z.string().optional(),
  isActive: z.boolean(),
  isRecommended: z.boolean(),
  name: z.string().trim().min(1, "نام الزامی است.").max(150),
  priceToman: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0).max(65535),
});

export const SUBSCRIPTION_STATUSES = [
  "pending",
  "active",
  "expired",
  "cancelled",
] as const;

export type AdminSubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const AdminProviderSubscriptionSchema = z
  .object({
    amountToman: z.number(),
    cancelledAt: z.string().nullable(),
    createdAt: z.string(),
    endsAt: z.string().nullable(),
    planCode: z.string(),
    planName: z.string(),
    providerId: z.string(),
    source: z.string(),
    startsAt: z.string().nullable(),
    status: z.string(),
    subscriptionId: z.string(),
  })
  .strict();

export type AdminSubscriptionPlan = z.infer<typeof AdminSubscriptionPlanSchema>;
export type AdminPlanFormValues = z.infer<typeof AdminPlanFormSchema>;
export type AdminProviderSubscription = z.infer<
  typeof AdminProviderSubscriptionSchema
>;

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

function featuresFromText(text?: string): string[] | undefined {
  if (!text?.trim()) return undefined;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function featuresToText(features: unknown): string {
  if (!features) return "";
  if (Array.isArray(features)) {
    return features.map(String).join("\n");
  }
  try {
    return JSON.stringify(features, null, 2);
  } catch {
    return String(features);
  }
}

export { featuresToText };

export async function fetchAdminSubscriptionPlans(input: {
  includeDeleted?: boolean;
  isActive?: "0" | "1";
  signal?: AbortSignal;
}): Promise<AdminSubscriptionPlan[]> {
  const result = await adminApi.get<{ plans: unknown[] }>(
    "/subscription-plans",
    {
      query: {
        includeDeleted: input.includeDeleted ? "1" : undefined,
        isActive: input.isActive,
      },
      signal: input.signal,
    },
  );
  return z.array(AdminSubscriptionPlanSchema).parse(result.data.plans);
}

export async function createAdminSubscriptionPlan(
  input: AdminPlanFormValues,
): Promise<AdminSubscriptionPlan> {
  const result = await adminApi.post<unknown>("/subscription-plans", {
    code: input.code.trim(),
    description: input.description?.trim() || null,
    durationMonths: input.durationMonths,
    features: featuresFromText(input.featuresText) ?? null,
    isActive: input.isActive,
    isRecommended: input.isRecommended,
    name: input.name.trim(),
    priceToman: input.priceToman,
    sortOrder: input.sortOrder,
  });
  return AdminSubscriptionPlanSchema.parse(result.data);
}

export async function patchAdminSubscriptionPlan(
  planId: string,
  input: Omit<AdminPlanFormValues, "code">,
): Promise<AdminSubscriptionPlan> {
  const result = await adminApi.patch<unknown>(
    `/subscription-plans/${planId}`,
    {
      description: input.description?.trim() || null,
      durationMonths: input.durationMonths,
      features: featuresFromText(input.featuresText) ?? null,
      isActive: input.isActive,
      isRecommended: input.isRecommended,
      name: input.name.trim(),
      priceToman: input.priceToman,
      sortOrder: input.sortOrder,
    },
  );
  return AdminSubscriptionPlanSchema.parse(result.data);
}

export async function deleteAdminSubscriptionPlan(planId: string): Promise<void> {
  await adminApi.delete(`/subscription-plans/${planId}`);
}

export async function fetchAdminProviderSubscriptions(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  providerId?: string;
  signal?: AbortSignal;
  status?: AdminSubscriptionStatus;
}): Promise<{ items: AdminProviderSubscription[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ subscriptions: unknown[] }>(
    "/provider-subscriptions",
    {
      query: {
        cursor: input.cursor || undefined,
        limit: input.limit,
        providerId: input.providerId || undefined,
        status: input.status,
      },
      signal: input.signal,
    },
  );
  return {
    items: z
      .array(AdminProviderSubscriptionSchema)
      .parse(result.data.subscriptions),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function cancelAdminProviderSubscription(
  subscriptionId: string,
  input: { reason: string },
): Promise<{ subscriptionId: string; status: string }> {
  const result = await adminApi.post<{
    subscriptionId: string;
    status: string;
  }>(`/provider-subscriptions/${subscriptionId}/cancel`, input);
  return result.data;
}

export async function grantAdminProviderSubscription(
  providerId: string,
  input: {
    durationMonths?: number;
    planCode: string;
    reason?: string;
  },
): Promise<{
  amountToman: number;
  endsAt: string | null;
  planName: string;
  remainingSeconds: number;
  source: string;
  startsAt: string | null;
  status: string;
  subscriptionId: string;
}> {
  const result = await adminApi.post<{
    amountToman: number;
    endsAt: string | null;
    planName: string;
    remainingSeconds: number;
    source: string;
    startsAt: string | null;
    status: string;
    subscriptionId: string;
  }>(`/providers/${providerId}/subscriptions/grant`, input, {
    headers: {
      [ADMIN_IDEMPOTENCY_HEADER]: createAdminIdempotencyKey("grant"),
    },
  });
  return result.data;
}
