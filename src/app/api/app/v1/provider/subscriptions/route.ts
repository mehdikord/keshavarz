import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { SubscriptionsQuerySchema } from "@/server/modules/subscriptions/subscriptions.schemas";
import { listCurrentProviderSubscriptions } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, SubscriptionsQuerySchema);
  const result = await listCurrentProviderSubscriptions(
    auth.internalUserId,
    query,
  );
  return apiSuccess({ subscriptions: result.items }, context.requestId, {
    meta: result.meta,
  });
});
