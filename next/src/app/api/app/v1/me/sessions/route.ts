import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { getUserSessions } from "@/server/modules/app-auth/app-auth.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const sessions = await getUserSessions(auth.internalUserId, auth.sessionId);
  return apiSuccess({ sessions }, context.requestId);
});
