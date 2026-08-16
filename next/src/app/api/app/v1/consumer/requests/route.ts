import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { ConsumerRequestsQuerySchema } from "@/server/modules/requests/request.schemas";
import { listConsumerServiceRequests } from "@/server/modules/requests/request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, ConsumerRequestsQuerySchema);
  const result = await listConsumerServiceRequests(auth.internalUserId, query);
  return apiSuccess({ requests: result.items }, context.requestId, {
    meta: result.meta,
  });
});
