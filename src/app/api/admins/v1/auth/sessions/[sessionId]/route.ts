import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getAllowedOrigins } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, withApiHandler } from "@/server/http";
import { revokeOwnAdminSession } from "@/server/modules/admin-auth/admin-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    getAllowedOrigins("admin"),
  );
  const auth = await requireAdminSession(request);
  const rawSessionId = request.nextUrl.pathname.split("/").at(-1) ?? "";
  if (!/^\d{1,20}$/.test(rawSessionId)) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "نشست یافت نشد.");
  }

  await revokeOwnAdminSession({
    adminId: auth.internalAdminId,
    currentSessionId: auth.sessionId,
    request,
    sessionId: BigInt(rawSessionId),
  });
  return apiSuccess({ revoked: true }, context.requestId);
});
