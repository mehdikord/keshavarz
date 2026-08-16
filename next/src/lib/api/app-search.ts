import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";
import {
  APP_IDEMPOTENCY_HEADER,
  createAppIdempotencyKey,
} from "@/lib/api/app-idempotency";

export const AppSearchContextSchema = z
  .object({
    categoryId: z.string(),
    categoryName: z.string(),
    consumerNote: z.string().nullable(),
    dates: z.array(z.string()),
    expiresAt: z.string(),
    landId: z.string(),
    landTitle: z.string(),
    searchId: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
  })
  .strict();

export type AppSearchContext = z.infer<typeof AppSearchContextSchema>;

export const AppSearchProviderSchema = z
  .object({
    distanceKm: z.number(),
    name: z.string().nullable(),
    previousStatus: z.enum(["rejected", "sent"]).nullable(),
    priceToman: z.number(),
    pricingUnit: z.string(),
    providerId: z.string(),
  })
  .strict();

export type AppSearchProvider = z.infer<typeof AppSearchProviderSchema>;

export type AppSearchSort =
  | "distanceAsc"
  | "distanceDesc"
  | "priceAsc"
  | "priceDesc";

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

export async function createAppServiceSearch(input: {
  categoryId?: string;
  consumerNote?: string | null;
  dates: string[];
  landId: string;
  serviceId: string;
  idempotencyKey?: string;
}): Promise<AppSearchContext> {
  const result = await appApi.post<unknown>(
    "/service-searches",
    {
      categoryId: input.categoryId,
      consumerNote: input.consumerNote,
      dates: input.dates,
      landId: input.landId,
      serviceId: input.serviceId,
    },
    {
      extraHeaders: {
        [APP_IDEMPOTENCY_HEADER]:
          input.idempotencyKey ?? createAppIdempotencyKey("search"),
      },
    },
  );
  return AppSearchContextSchema.parse(result.data);
}

export async function fetchAppSearchProviders(input: {
  cursor?: string | null;
  limit?: AdminListLimit;
  searchId: string;
  signal?: AbortSignal;
  sort?: AppSearchSort;
}): Promise<{
  items: AppSearchProvider[];
  meta: AdminCursorMeta;
  search: AppSearchContext;
}> {
  const limit = input.limit ?? 20;
  const result = await appApi.get<unknown>(
    `/service-searches/${input.searchId}/providers`,
    {
      query: {
        cursor: input.cursor ?? undefined,
        limit,
        sort: input.sort ?? "distanceAsc",
      },
      signal: input.signal,
    },
  );
  const data = z
    .object({
      providers: z.array(AppSearchProviderSchema),
      search: AppSearchContextSchema,
    })
    .parse(result.data);
  return {
    items: data.providers,
    meta: CursorMetaSchema.parse(
      result.meta ?? { hasMore: false, limit, nextCursor: null },
    ),
    search: data.search,
  };
}

export function uiSortToApiSort(
  sort: "price-asc" | "price-desc" | "distance-asc" | "distance-desc",
): AppSearchSort {
  switch (sort) {
    case "price-asc":
      return "priceAsc";
    case "price-desc":
      return "priceDesc";
    case "distance-desc":
      return "distanceDesc";
    default:
      return "distanceAsc";
  }
}
