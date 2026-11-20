import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, withApiHandler } from "@/server/http";
import { getAdminViewer } from "@/server/modules/admin/auth/admin-auth.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  const viewer = await getAdminViewer(auth.internalAdminId);
  if (!viewer) {
    throw new ApiError(401, API_ERROR_CODES.invalidSession, "نشست معتبر نیست یا منقضی شده است.");
  }
  return apiSuccess(viewer, context.requestId);
});
