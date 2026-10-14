import type { NextRequest } from "next/server";

import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { setAdminAuthCookies } from "@/server/modules/admin-auth/admin-auth.cookies";
import { AdminLoginSchema } from "@/server/modules/admin-auth/admin-auth.schemas";
import { loginAdmin } from "@/server/modules/admin-auth/admin-auth.service";
import { assertTrustedOrigin } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertTrustedOrigin(
    request,
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const input = await parseJsonBody(request, AdminLoginSchema);
  const result = await loginAdmin(input, request);
  const response = apiSuccess({ adminId: result.adminId }, context.requestId);
  setAdminAuthCookies(response, result);
  return response;
});
