import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { appApi } from "@/lib/api/app-client";
import type { Land } from "@/types";

export const AppLandSchema = z
  .object({
    areaSquareMeters: z.string(),
    createdAt: z.string(),
    description: z.string().nullable(),
    landId: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    title: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type AppLand = z.infer<typeof AppLandSchema>;

const CursorMetaSchema = z
  .object({
    hasMore: z.boolean(),
    limit: z.number().int(),
    nextCursor: z.string().nullable(),
  })
  .strict();

function parseMeta(
  meta: Record<string, unknown> | undefined,
  fallbackLimit: number,
): AdminCursorMeta {
  return CursorMetaSchema.parse(
    meta ?? { hasMore: false, limit: fallbackLimit, nextCursor: null },
  );
}

export function mapAppLandToUi(land: AppLand, userId = ""): Land {
  return {
    areaSqm: Number(land.areaSquareMeters),
    createdAt: land.createdAt,
    description: land.description ?? undefined,
    id: land.landId,
    location: {
      lat: Number(land.latitude),
      lng: Number(land.longitude),
    },
    title: land.title,
    userId,
  };
}

export async function fetchAppLands(input?: {
  cursor?: string | null;
  limit?: AdminListLimit;
  signal?: AbortSignal;
}): Promise<{ items: AppLand[]; meta: AdminCursorMeta }> {
  const limit = input?.limit ?? 50;
  const result = await appApi.get<unknown>("/lands", {
    query: {
      cursor: input?.cursor ?? undefined,
      limit,
    },
    signal: input?.signal,
  });
  const data = z.object({ lands: z.array(AppLandSchema) }).parse(result.data);
  return { items: data.lands, meta: parseMeta(result.meta, limit) };
}

export async function fetchAppLand(
  landId: string,
  signal?: AbortSignal,
): Promise<AppLand> {
  const result = await appApi.get<unknown>(`/lands/${landId}`, { signal });
  return AppLandSchema.parse(result.data);
}

export async function createAppLand(input: {
  areaSquareMeters: string;
  description?: string | null;
  latitude: string;
  longitude: string;
  title: string;
}): Promise<AppLand> {
  const result = await appApi.post<unknown>("/lands", input);
  return AppLandSchema.parse(result.data);
}

export async function updateAppLand(
  landId: string,
  input: {
    areaSquareMeters?: string;
    description?: string | null;
    latitude?: string;
    longitude?: string;
    title?: string;
  },
): Promise<AppLand> {
  const result = await appApi.patch<unknown>(`/lands/${landId}`, input);
  return AppLandSchema.parse(result.data);
}

export async function deleteAppLand(landId: string): Promise<void> {
  await appApi.delete(`/lands/${landId}`);
}
