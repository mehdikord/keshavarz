import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { ProviderRequestsQuerySchema } from "@/server/modules/requests/request.schemas";
import { listProviderServiceRequests } from "@/server/modules/requests/request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, ProviderRequestsQuerySchema);
  const result = await listProviderServiceRequests(auth.internalUserId, query);
  return apiSuccess({ requests: result.items }, context.requestId, {
    meta: result.meta,
  });
});
