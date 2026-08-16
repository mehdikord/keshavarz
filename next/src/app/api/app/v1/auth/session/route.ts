import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, withApiHandler } from "@/server/http";
import { clearAppAuthCookies } from "@/server/modules/app-auth/app-auth.cookies";
import { logoutCurrentSession } from "@/server/modules/app-auth/app-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "app", new Set([getSecurityEnvironment().APP_ORIGIN]));
  const auth = await requireUserSession(request);
  await logoutCurrentSession(auth.internalUserId, auth.sessionId);
  const response = apiSuccess({ loggedOut: true }, context.requestId);
  clearAppAuthCookies(response);
  return response;
});
