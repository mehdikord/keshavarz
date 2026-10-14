import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { getCurrentProviderDashboard } from "@/server/modules/provider/provider.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const dashboard = await getCurrentProviderDashboard(auth.internalUserId);
  return apiSuccess(dashboard, context.requestId);
});
