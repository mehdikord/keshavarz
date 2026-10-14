import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, getClientIp, getUserAgent, withApiHandler } from "@/server/http";
import { setAppAuthCookies } from "@/server/modules/app-auth/app-auth.cookies";
import { rotateUserSession } from "@/server/modules/app-auth/app-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const result = await rotateUserSession({
    currentSessionId: auth.sessionId,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  const response = apiSuccess({ refreshed: true }, context.requestId);
  setAppAuthCookies(response, result);
  return response;
});
