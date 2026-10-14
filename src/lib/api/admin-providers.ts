import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";
import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";

export const AdminProviderListItemSchema = z
  .object({
    approved: z.boolean(),
    approvedAt: z.string().nullable(),
    bio: z.string().nullable(),
    createdAt: z.string(),
    isActive: z.boolean(),
    isAvailable: z.boolean(),
    name: z.string(),
    phone: z.string(),
    providerId: z.string(),
    userImage: z.string().nullable(),
    workRadiusKm: z.number(),
  })
  .strict();

export const AdminProviderDetailSchema = AdminProviderListItemSchema.extend({
  activeSubscription: z
    .object({
      amountToman: z.number(),
      endsAt: z.string().nullable(),
      planName: z.string(),
      source: z.string(),
      startsAt: z.string().nullable(),
      status: z.string(),
      subscriptionId: z.string(),
    })
    .nullable(),
  servicesCount: z.number(),
  updatedAt: z.string(),
  user: z.object({
    image: z.string().nullable(),
    name: z.string(),
    phone: z.string(),
    userId: z.string(),
  }),
  workArea: z.object({
    workLatitude: z.string().nullable(),
    workLongitude: z.string().nullable(),
    workRadiusKm: z.number(),
  }),
});

export const AdminProviderServiceSchema = z
  .object({
    description: z.string().nullable(),
    isActive: z.boolean(),
    priceToman: z.number(),
    pricingUnit: z.string(),
    providerServiceId: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type AdminProviderListItem = z.infer<typeof AdminProviderListItemSchema>;
export type AdminProviderDetail = z.infer<typeof AdminProviderDetailSchema>;
export type AdminProviderService = z.infer<typeof AdminProviderServiceSchema>;

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

export async function fetchAdminProviders(input: {
  approved?: "yes" | "no";
  cursor?: string | null;
  isActive?: "0" | "1";
  isAvailable?: "0" | "1";
  limit?: AdminListLimit;
  q?: string;
  signal?: AbortSignal;
}): Promise<{ items: AdminProviderListItem[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ providers: unknown[] }>("/providers", {
    query: {
      approved: input.approved,
      cursor: input.cursor || undefined,
      isActive: input.isActive,
      isAvailable: input.isAvailable,
      limit: input.limit,
      q: input.q || undefined,
    },
    signal: input.signal,
  });

  return {
    items: z.array(AdminProviderListItemSchema).parse(result.data.providers),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function fetchAdminProvider(
  providerId: string,
  signal?: AbortSignal,
): Promise<AdminProviderDetail> {
  const result = await adminApi.get<unknown>(`/providers/${providerId}`, {
    signal,
  });
  return AdminProviderDetailSchema.parse(result.data);
}

export async function patchAdminProvider(
  providerId: string,
  input: {
    bio?: string | null;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
): Promise<AdminProviderDetail> {
  const result = await adminApi.patch<unknown>(
    `/providers/${providerId}`,
    input,
  );
  return AdminProviderDetailSchema.parse(result.data);
}

export async function approveAdminProvider(
  providerId: string,
  input: { isActive?: boolean } = {},
): Promise<AdminProviderDetail> {
  const result = await adminApi.post<unknown>(
    `/providers/${providerId}/approve`,
    input,
  );
  return AdminProviderDetailSchema.parse(result.data);
}

export async function updateAdminProviderAvailability(
  providerId: string,
  input: { isActive?: boolean; isAvailable?: boolean },
): Promise<AdminProviderDetail> {
  const result = await adminApi.post<unknown>(
    `/providers/${providerId}/availability`,
    input,
  );
  return AdminProviderDetailSchema.parse(result.data);
}

export async function fetchAdminProviderServices(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  providerId: string;
  signal?: AbortSignal;
}): Promise<{ items: AdminProviderService[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ services: unknown[] }>(
    `/providers/${input.providerId}/services`,
    {
      query: {
        cursor: input.cursor || undefined,
        limit: input.limit,
      },
      signal: input.signal,
    },
  );

  return {
    items: z.array(AdminProviderServiceSchema).parse(result.data.services),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function patchAdminProviderService(
  providerServiceId: string,
  input: {
    description?: string | null;
    isActive?: boolean;
    priceToman?: number;
    pricingUnit?: string;
  },
): Promise<AdminProviderService> {
  const result = await adminApi.patch<unknown>(
    `/provider-services/${providerServiceId}`,
    input,
  );
  return AdminProviderServiceSchema.parse(result.data);
}
