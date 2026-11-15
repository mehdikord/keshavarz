import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";
import {
  APP_IDEMPOTENCY_HEADER,
  createAppIdempotencyKey,
} from "@/lib/api/app-idempotency";

export const REQUEST_STATUSES = [
  "awaiting_send",
  "pending_provider",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const LINK_STATUSES = [
  "sent",
  "accepted",
  "rejected",
  "removed",
] as const;

export type AppRequestStatus = (typeof REQUEST_STATUSES)[number];
export type AppLinkStatus = (typeof LINK_STATUSES)[number];

export const AppConsumerRequestSummarySchema = z
  .object({
    agreedPriceToman: z.number().nullable(),
    assignedProviderName: z.string().nullable(),
    createdAt: z.string(),
    landTitle: z.string(),
    /** Providers found by the search (stored candidates). */
    providersFound: z.number().int(),
    /** Providers the request was sent to (any link status). */
    providersSent: z.number().int(),
    requestId: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number().int(),
  })
  .strict();

export type AppConsumerRequestSummary = z.infer<
  typeof AppConsumerRequestSummarySchema
>;

export const AppRequestLandSchema = z
  .object({
    areaSquareMeters: z.string().nullable(),
    latitude: z.string().nullable(),
    longitude: z.string().nullable(),
    title: z.string(),
  })
  .strict();

export const AppRequestProviderLinkSchema = z
  .object({
    distanceKm: z.number(),
    name: z.string(),
    phone: z.string().nullable(),
    priceToman: z.number(),
    providerId: z.string(),
    status: z.string(),
  })
  .strict();

export const AppConsumerRequestDetailSchema = z
  .object({
    acceptedAt: z.string().nullable(),
    agreedPriceToman: z.number().nullable(),
    assignedProviderId: z.string().nullable(),
    assignedProviderName: z.string().nullable(),
    cancelReason: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    consumerNote: z.string().nullable(),
    createdAt: z.string(),
    dates: z.array(z.string()),
    land: AppRequestLandSchema,
    providers: z.array(AppRequestProviderLinkSchema),
    requestId: z.string(),
    serviceCategoryName: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number().int(),
  })
  .strict();

export type AppConsumerRequestDetail = z.infer<
  typeof AppConsumerRequestDetailSchema
>;

export const AppProviderRequestSummarySchema = z
  .object({
    distanceKm: z.number(),
    landTitle: z.string(),
    linkStatus: z.string(),
    priceToman: z.number(),
    requestId: z.string(),
    sentAt: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number().int(),
  })
  .strict();

export type AppProviderRequestSummary = z.infer<
  typeof AppProviderRequestSummarySchema
>;

export const AppProviderRequestDetailSchema = z
  .object({
    acceptedAt: z.string().nullable(),
    agreedPriceToman: z.number().nullable(),
    cancelReason: z.string().nullable(),
    cancelledAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    consumer: z
      .object({
        name: z.string(),
        phone: z.string().nullable(),
      })
      .strict(),
    consumerNote: z.string().nullable(),
    createdAt: z.string(),
    dates: z.array(z.string()),
    distanceKm: z.number(),
    isAssigned: z.boolean(),
    land: AppRequestLandSchema,
    linkStatus: z.string(),
    priceToman: z.number(),
    requestId: z.string(),
    serviceCategoryName: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number().int(),
    viewedAt: z.string().nullable(),
  })
  .strict();

export type AppProviderRequestDetail = z.infer<
  typeof AppProviderRequestDetailSchema
>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export const CANDIDATE_STATES = [
  "available",
  "unavailable",
  "sent",
  "rejected",
  "accepted",
  "removed",
] as const;

export type AppCandidateState = (typeof CANDIDATE_STATES)[number];

export const AppRequestCandidateSchema = z
  .object({
    /** Declined another of this farmer's requests for the same land + service. */
    declinedBefore: z.boolean(),
    distanceKm: z.number(),
    image: z.string().nullable(),
    name: z.string(),
    /** Only for the accepted provider once the request is in progress. */
    phone: z.string().nullable(),
    priceToman: z.number(),
    pricingUnit: z.string(),
    providerId: z.string(),
    /** Already waiting on another open request for the same land + service. */
    sentInOtherRequest: z.boolean(),
    state: z.enum(CANDIDATE_STATES),
  })
  .strict();

export type AppRequestCandidate = z.infer<typeof AppRequestCandidateSchema>;

export const AppCandidateRequestContextSchema = z
  .object({
    assignedProviderName: z.string().nullable(),
    categoryName: z.string(),
    consumerNote: z.string().nullable(),
    createdAt: z.string(),
    dates: z.array(z.string()),
    landAreaSquareMeters: z.string(),
    landId: z.string(),
    landTitle: z.string(),
    requestId: z.string(),
    serviceName: z.string(),
    status: z.string(),
    version: z.number().int(),
  })
  .strict();

export type AppCandidateRequestContext = z.infer<
  typeof AppCandidateRequestContextSchema
>;

/** Every provider found for the request, merged with a live re-search. */
export async function fetchRequestCandidates(
  requestId: string,
  signal?: AbortSignal,
): Promise<{
  candidates: AppRequestCandidate[];
  request: AppCandidateRequestContext;
}> {
  const result = await appApi.get<unknown>(
    `/service-requests/${requestId}/providers`,
    { signal },
  );
  return z
    .object({
      candidates: z.array(AppRequestCandidateSchema),
      request: AppCandidateRequestContextSchema,
    })
    .strict()
    .parse(result.data);
}

const SendResultProviderSchema = z
  .object({ name: z.string().nullable(), providerId: z.string() })
  .strict();

export const AppSendRequestResultSchema = z
  .object({
    requestId: z.string(),
    sent: z.array(SendResultProviderSchema),
    skipped: z.array(
      SendResultProviderSchema.extend({
        reason: z.enum(["already_sent", "not_eligible"]),
      }).strict(),
    ),
    status: z.string(),
    version: z.number().int(),
  })
  .strict();

export type AppSendRequestResult = z.infer<typeof AppSendRequestResultSchema>;

/** Sends to eligible providers; ineligible ones come back in `skipped`. */
export async function sendAppRequestToProviders(input: {
  providerIds: string[];
  requestId: string;
  idempotencyKey?: string;
}): Promise<AppSendRequestResult> {
  const result = await appApi.post<unknown>(
    `/service-requests/${input.requestId}/providers`,
    { providerIds: input.providerIds },
    {
      extraHeaders: {
        [APP_IDEMPOTENCY_HEADER]:
          input.idempotencyKey ?? createAppIdempotencyKey("add-providers"),
      },
    },
  );
  return AppSendRequestResultSchema.parse(result.data);
}

export async function fetchConsumerRequests(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
  /** `open` = awaiting_send + pending_provider. */
  status?: AppRequestStatus | "open";
}): Promise<{ items: AppConsumerRequestSummary[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 20;
  const result = await appApi.get<unknown>("/consumer/requests", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
      status: input?.status,
    },
    signal: input?.signal,
  });
  const data = z
    .object({ requests: z.array(AppConsumerRequestSummarySchema) })
    .parse(result.data);
  return {
    items: data.requests,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function fetchConsumerRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<AppConsumerRequestDetail> {
  const result = await appApi.get<unknown>(`/consumer/requests/${requestId}`, {
    signal,
  });
  return AppConsumerRequestDetailSchema.parse(result.data);
}

export async function cancelConsumerRequest(
  requestId: string,
  input?: { expectedVersion?: number; reason?: string },
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/consumer/requests/${requestId}/cancel`,
    input ?? {},
  );
  return result.data;
}

export async function completeConsumerRequest(
  requestId: string,
  input?: { expectedVersion?: number },
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/consumer/requests/${requestId}/complete`,
    input ?? {},
  );
  return result.data;
}

export async function fetchProviderRequests(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  linkStatus?: AppLinkStatus;
  signal?: AbortSignal;
}): Promise<{ items: AppProviderRequestSummary[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 20;
  const result = await appApi.get<unknown>("/provider/requests", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
      linkStatus: input?.linkStatus,
    },
    signal: input?.signal,
  });
  const data = z
    .object({ requests: z.array(AppProviderRequestSummarySchema) })
    .parse(result.data);
  return {
    items: data.requests,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
  };
}

export async function fetchProviderRequest(
  requestId: string,
  signal?: AbortSignal,
): Promise<AppProviderRequestDetail> {
  const result = await appApi.get<unknown>(`/provider/requests/${requestId}`, {
    signal,
  });
  return AppProviderRequestDetailSchema.parse(result.data);
}

export async function viewProviderRequest(
  requestId: string,
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/provider/requests/${requestId}/view`,
    {},
  );
  return result.data;
}

export async function acceptProviderRequest(
  requestId: string,
  input?: { expectedVersion?: number },
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/provider/requests/${requestId}/accept`,
    input ?? {},
  );
  return result.data;
}

export async function rejectProviderRequest(
  requestId: string,
  input?: { expectedVersion?: number; reason?: string },
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/provider/requests/${requestId}/reject`,
    input ?? {},
  );
  return result.data;
}

export async function cancelProviderRequest(
  requestId: string,
  input?: { expectedVersion?: number; reason?: string },
): Promise<unknown> {
  const result = await appApi.post<unknown>(
    `/provider/requests/${requestId}/cancel`,
    input ?? {},
  );
  return result.data;
}
