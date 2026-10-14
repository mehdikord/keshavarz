import type { NextRequest } from "next/server";

import { apiSuccess, withApiHandler } from "@/server/http";
import { listSubscriptionPlans } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const plans = await listSubscriptionPlans();
  return apiSuccess({ plans }, context.requestId, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
});
