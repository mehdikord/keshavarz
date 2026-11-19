import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getAllowedOrigins } from "@/server/config/env";
import { apiSuccess, withApiHandler } from "@/server/http";
import { clearAdminAuthCookies } from "@/server/modules/admin-auth/admin-auth.cookies";
import {
  listCurrentAdminSessions,
  logoutAllAdminSessions,
} from "@/server/modules/admin-auth/admin-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  return apiSuccess(
    await listCurrentAdminSessions(auth.internalAdminId, auth.sessionId),
    context.requestId,
  );
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    getAllowedOrigins("admin"),
  );
  const auth = await requireAdminSession(request);
  // `?scope=others` keeps the current device signed in.
  if (request.nextUrl.searchParams.get("scope") === "others") {
    const revokedCount = await logoutAllAdminSessions(
      auth.internalAdminId,
      auth.sessionId,
    );
    return apiSuccess({ revokedCount }, context.requestId);
  }

  const revokedCount = await logoutAllAdminSessions(auth.internalAdminId);
  const response = apiSuccess({ revokedCount }, context.requestId);
  clearAdminAuthCookies(response);
  return response;
});
