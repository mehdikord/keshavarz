import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, withApiHandler } from "@/server/http";
import { clearAdminAuthCookies } from "@/server/modules/admin-auth/admin-auth.cookies";
import { logoutCurrentAdminSession } from "@/server/modules/admin-auth/admin-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await logoutCurrentAdminSession(auth.internalAdminId, auth.sessionId);
  const response = apiSuccess({ loggedOut: true }, context.requestId);
  clearAdminAuthCookies(response);
  return response;
});
