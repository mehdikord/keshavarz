import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { ServiceParamsSchema } from "@/server/modules/catalog/catalog.schemas";
import { getCatalogService } from "@/server/modules/catalog/catalog.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireUserSession(request);
  const serviceId = request.nextUrl.pathname.split("/").at(-1);
  const params = parseWithSchema(ServiceParamsSchema, { serviceId });
  const service = await getCatalogService(params.serviceId);
  return apiSuccess(
    service,
    context.requestId,
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
});
