import type { NextRequest } from "next/server";
import * as z from "zod";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { CatalogSlugSchema } from "@/server/modules/catalog/catalog.schemas";
import { drawFeaturedServices } from "@/server/modules/catalog/catalog.service";

export const runtime = "nodejs";

const QuerySchema = z.object({
  /** Comma-separated service ids shown last time; the draw avoids them when it can. */
  exclude: z
    .string()
    .max(1000)
    .optional()
    .transform((value) => (value ? value.split(",").filter(Boolean).slice(0, 20) : []))
    .pipe(z.array(CatalogSlugSchema)),
  limit: z.coerce.number().int().min(1).max(6).default(3),
});

/** Random picks from the admin's special services, for the app home. Never cached: each visit draws again. */
export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireUserSession(request);
  const query = parseWithSchema(QuerySchema, {
    exclude: request.nextUrl.searchParams.get("exclude") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  const services = await drawFeaturedServices(query.limit, query.exclude);
  return apiSuccess({ services }, context.requestId, { headers: { "Cache-Control": "no-store" } });
});
