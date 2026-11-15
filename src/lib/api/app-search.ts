import * as z from "zod";

import { appApi } from "@/lib/api/app-client";
import {
  APP_IDEMPOTENCY_HEADER,
  createAppIdempotencyKey,
} from "@/lib/api/app-idempotency";

/**
 * A search either creates a request (≥1 provider found), finds nothing (no
 * request is stored), or stops at an existing open request for the same land
 * and service so the farmer can decide (`allowDuplicate: true` to proceed).
 */
export const AppServiceSearchResultSchema = z.discriminatedUnion("outcome", [
  z
    .object({
      outcome: z.literal("created"),
      providersFound: z.number().int(),
      requestId: z.string(),
      status: z.string(),
      version: z.number().int(),
    })
    .strict(),
  z
    .object({
      duplicate: z
        .object({
          createdAt: z.string(),
          requestId: z.string(),
          status: z.string(),
        })
        .strict(),
      outcome: z.literal("duplicate"),
      providersFound: z.number().int(),
    })
    .strict(),
  z
    .object({
      outcome: z.literal("no_providers"),
      providersFound: z.literal(0),
    })
    .strict(),
]);

export type AppServiceSearchResult = z.infer<typeof AppServiceSearchResultSchema>;

export async function createAppServiceSearch(input: {
  allowDuplicate?: boolean;
  categoryId?: string;
  consumerNote?: string | null;
  dates: string[];
  landId: string;
  serviceId: string;
  idempotencyKey?: string;
}): Promise<AppServiceSearchResult> {
  const result = await appApi.post<unknown>(
    "/service-searches",
    {
      allowDuplicate: input.allowDuplicate,
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
  return AppServiceSearchResultSchema.parse(result.data);
}
