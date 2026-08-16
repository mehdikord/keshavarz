import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";
import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";

export const REQUEST_STATUSES = [
  "pending_provider",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type AdminRequestStatus = (typeof REQUEST_STATUSES)[number];

export const AdminRequestListItemSchema = z
  .object({
    agreedPriceToman: z.number().nullable(),
    assignedProviderName: z.string().nullable(),
    consumerUserId: z.string(),
    createdAt: z.string(),
    landTitle: z.string(),
    requestId: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number(),
  })
  .strict();

export const AdminRequestProviderLinkSchema = z
  .object({
    distanceKm: z.number(),
    linkId: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    priceToman: z.number(),
    providerId: z.string(),
    rejectionReason: z.string().nullable(),
    removedReason: z.string().nullable(),
    respondedAt: z.string().nullable(),
    sentAt: z.string(),
    status: z.string(),
    viewedAt: z.string().nullable(),
  })
  .strict();

export const AdminRequestDetailSchema = z
  .object({
    acceptedAt: z.string().nullable(),
    agreedPriceToman: z.number().nullable(),
    assignedProviderId: z.string().nullable(),
    assignedProviderName: z.string().nullable(),
    cancelReason: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    cancelledBy: z.string().nullable(),
    completedAt: z.string().nullable(),
    consumer: z
      .object({
        name: z.string(),
        userId: z.string(),
      })
      .strict(),
    consumerNote: z.string().nullable(),
    createdAt: z.string(),
    dates: z.array(z.string()),
    land: z
      .object({
        areaSquareMeters: z.string(),
        latitude: z.string(),
        longitude: z.string(),
        title: z.string(),
      })
      .strict(),
    providers: z.array(AdminRequestProviderLinkSchema),
    requestId: z.string(),
    serviceCategoryName: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number(),
  })
  .strict();

export const AdminRequestStatusHistorySchema = z
  .object({
    actorAdminId: z.string().nullable(),
    actorType: z.string(),
    actorUserId: z.string().nullable(),
    createdAt: z.string(),
    fromStatus: z.string().nullable(),
    historyId: z.string(),
    reason: z.string().nullable(),
    toStatus: z.string(),
  })
  .strict();

export const AdminRequestProviderLinkHistorySchema =
  AdminRequestStatusHistorySchema.extend({
    linkId: z.string(),
  }).strict();

export const AdminRequestHistoriesSchema = z
  .object({
    providerLinkHistories: z.array(AdminRequestProviderLinkHistorySchema),
    statusHistories: z.array(AdminRequestStatusHistorySchema),
  })
  .strict();

export type AdminRequestListItem = z.infer<typeof AdminRequestListItemSchema>;
export type AdminRequestDetail = z.infer<typeof AdminRequestDetailSchema>;
export type AdminRequestProviderLink = z.infer<
  typeof AdminRequestProviderLinkSchema
>;
export type AdminRequestHistories = z.infer<typeof AdminRequestHistoriesSchema>;

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

export async function fetchAdminServiceRequests(input: {
  consumerUserId?: string;
  cursor?: string | null;
  limit?: AdminListLimit;
  q?: string;
  signal?: AbortSignal;
  status?: AdminRequestStatus;
}): Promise<{ items: AdminRequestListItem[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ requests: unknown[] }>(
    "/service-requests",
    {
      query: {
        consumerUserId: input.consumerUserId || undefined,
        cursor: input.cursor || undefined,
        limit: input.limit,
        q: input.q || undefined,
        status: input.status,
      },
      signal: input.signal,
    },
  );

  return {
    items: z.array(AdminRequestListItemSchema).parse(result.data.requests),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function fetchAdminServiceRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<AdminRequestDetail> {
  const result = await adminApi.get<unknown>(`/service-requests/${requestId}`, {
    signal,
  });
  return AdminRequestDetailSchema.parse(result.data);
}

export async function fetchAdminServiceRequestHistories(
  requestId: string,
  signal?: AbortSignal,
): Promise<AdminRequestHistories> {
  const result = await adminApi.get<unknown>(
    `/service-requests/${requestId}/histories`,
    { signal },
  );
  return AdminRequestHistoriesSchema.parse(result.data);
}

export async function cancelAdminServiceRequest(
  requestId: string,
  input: { expectedVersion?: number; reason: string },
): Promise<{ requestId: string; status: string }> {
  const result = await adminApi.post<{ requestId: string; status: string }>(
    `/service-requests/${requestId}/cancel`,
    input,
  );
  return result.data;
}

export async function removeAdminProviderLink(
  linkId: string,
  input: { reason?: string } = {},
): Promise<{
  linkId: string;
  removedReason: string;
  requestId: string;
  status: string;
}> {
  const result = await adminApi.post<{
    linkId: string;
    removedReason: string;
    requestId: string;
    status: string;
  }>(`/service-request-providers/${linkId}/remove`, input);
  return result.data;
}
