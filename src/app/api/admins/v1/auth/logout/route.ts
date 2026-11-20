import type { NextRequest } from "next/server";

import { resolveAdminSessionToken } from "@/server/auth";
import { getAllowedOrigins } from "@/server/config/env";
import { apiSuccess, withApiHandler } from "@/server/http";
import { clearAdminAuthCookies } from "@/server/modules/admin/auth/admin-auth.cookies";
import { logoutAdmin } from "@/server/modules/admin/auth/admin-auth.service";
import { assertMutationProtection, getSessionCookieName } from "@/server/security";

export const runtime = "nodejs";

/** Always clears the cookies, even when the session already expired. */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "admins", getAllowedOrigins("admin"));
  const auth = await resolveAdminSessionToken(
    request.cookies.get(getSessionCookieName("admins"))?.value,
  );
  if (auth) {
    await logoutAdmin({ adminId: auth.internalAdminId, sessionId: auth.sessionId }, request);
  }
  const response = apiSuccess({ signedOut: true }, context.requestId);
  clearAdminAuthCookies(response);
  return response;
});
