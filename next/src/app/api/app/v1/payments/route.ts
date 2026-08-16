import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { PaymentsQuerySchema } from "@/server/modules/subscriptions/subscriptions.schemas";
import { listCurrentUserPayments } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, PaymentsQuerySchema);
  const result = await listCurrentUserPayments(auth.internalUserId, query);
  return apiSuccess({ payments: result.items }, context.requestId, {
    meta: result.meta,
  });
});
