import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { AdminChangePasswordSchema } from "@/server/modules/admin-auth/admin-auth.schemas";
import { changeCurrentAdminPassword } from "@/server/modules/admin-auth/admin-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  const input = await parseJsonBody(request, AdminChangePasswordSchema);
  await changeCurrentAdminPassword(
    {
      adminId: auth.internalAdminId,
      currentPassword: input.currentPassword,
      currentSessionId: auth.sessionId,
      newPassword: input.newPassword,
    },
    request,
  );
  return apiSuccess({ passwordChanged: true }, context.requestId);
});
