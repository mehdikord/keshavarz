import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";

export const PRICING_UNITS = [
  "fixed",
  "per_hectare",
  "per_square_meter",
  "per_hour",
  "per_day",
] as const;

export type AppPricingUnit = (typeof PRICING_UNITS)[number];

export const AppProviderProfileSchema = z
  .object({
    approved: z.boolean(),
    approvedAt: z.string().nullable(),
    bio: z.string().nullable(),
    eligibility: z
      .object({
        missing: z.array(z.string()),
        searchable: z.boolean(),
      })
      .strict(),
    isActive: z.boolean(),
    isAvailable: z.boolean(),
    workLatitude: z.string().nullable(),
    workLongitude: z.string().nullable(),
    workRadiusKm: z.number().int(),
  })
  .strict();

export type AppProviderProfile = z.infer<typeof AppProviderProfileSchema>;

export const AppProviderServiceSchema = z
  .object({
    description: z.string().nullable(),
    isActive: z.boolean(),
    priceToman: z.number().int(),
    pricingUnit: z.string(),
    providerServiceId: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type AppProviderService = z.infer<typeof AppProviderServiceSchema>;

export const AppProviderDashboardSchema = z
  .object({
    counts: z
      .object({
        inProgressRequests: z.number().int(),
        newRequests: z.number().int(),
        unreadNotifications: z.number().int(),
      })
      .strict(),
    monthlyRevenueToman: z.number(),
    warnings: z.array(z.string()),
  })
  .strict();

export type AppProviderDashboard = z.infer<typeof AppProviderDashboardSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export async function fetchAppProviderProfile(
  signal?: AbortSignal,
): Promise<AppProviderProfile> {
  const result = await appApi.get<unknown>("/provider/profile", { signal });
  return AppProviderProfileSchema.parse(result.data);
}

export async function upsertAppProviderProfile(input: {
  bio?: string | null;
}): Promise<AppProviderProfile> {
  const result = await appApi.put<unknown>("/provider/profile", input);
  return AppProviderProfileSchema.parse(result.data);
}

export async function patchAppProviderWorkArea(input: {
  isAvailable?: boolean;
  workLatitude?: string | null;
  workLongitude?: string | null;
  workRadiusKm?: number;
}): Promise<AppProviderProfile> {
  const result = await appApi.patch<unknown>("/provider/work-area", input);
  return AppProviderProfileSchema.parse(result.data);
}

export async function fetchAppProviderServices(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
}): Promise<{ items: AppProviderService[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 50;
  const result = await appApi.get<unknown>("/provider/services", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
    },
    signal: input?.signal,
  });
  const data = z
    .object({ services: z.array(AppProviderServiceSchema) })
    .parse(result.data);
  return {
    items: data.services,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function createAppProviderService(input: {
  description?: string | null;
  priceToman: number;
  pricingUnit?: AppPricingUnit;
  serviceId: string;
}): Promise<AppProviderService> {
  const result = await appApi.post<unknown>("/provider/services", {
    description: input.description,
    priceToman: input.priceToman,
    pricingUnit: input.pricingUnit ?? "fixed",
    serviceId: input.serviceId,
  });
  return AppProviderServiceSchema.parse(result.data);
}

export async function updateAppProviderService(
  providerServiceId: string,
  input: {
    description?: string | null;
    priceToman?: number;
    pricingUnit?: AppPricingUnit;
  },
): Promise<AppProviderService> {
  const result = await appApi.patch<unknown>(
    `/provider/services/${encodeURIComponent(providerServiceId)}`,
    input,
  );
  return AppProviderServiceSchema.parse(result.data);
}

export async function deleteAppProviderService(
  providerServiceId: string,
): Promise<void> {
  await appApi.delete(
    `/provider/services/${encodeURIComponent(providerServiceId)}`,
  );
}

export async function fetchAppProviderDashboard(
  signal?: AbortSignal,
): Promise<AppProviderDashboard> {
  const result = await appApi.get<unknown>("/provider/dashboard", { signal });
  return AppProviderDashboardSchema.parse(result.data);
}
