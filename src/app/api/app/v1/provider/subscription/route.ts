import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { getCurrentProviderSubscription } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const result = await getCurrentProviderSubscription(auth.internalUserId);
  return apiSuccess(result, context.requestId);
});
