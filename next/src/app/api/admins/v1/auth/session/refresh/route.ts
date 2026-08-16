import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, getClientIp, getUserAgent, withApiHandler } from "@/server/http";
import { setAdminAuthCookies } from "@/server/modules/admin-auth/admin-auth.cookies";
import { rotateAdminSession } from "@/server/modules/admin-auth/admin-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  const result = await rotateAdminSession({
    currentSessionId: auth.sessionId,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  const response = apiSuccess({ refreshed: true }, context.requestId);
  setAdminAuthCookies(response, result);
  return response;
});
