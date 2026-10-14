import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminUserParamsSchema,
  AdminUserUpdateSchema,
} from "@/server/modules/admin-users/admin-users.schemas";
import {
  getUserForAdmin,
  updateUserForAdmin,
} from "@/server/modules/admin-users/admin-users.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function userIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "users.view", request);
  const params = parseWithSchema(AdminUserParamsSchema, {
    userId: userIdFromPath(request),
  });
  const user = await getUserForAdmin(params.userId);
  return apiSuccess(user, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "users.update", request);
  const params = parseWithSchema(AdminUserParamsSchema, {
    userId: userIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminUserUpdateSchema);
  const result = await updateUserForAdmin(params.userId, input);

  await writeAdminAuditLog({
    action: "user_update",
    adminId: auth.internalAdminId,
    auditableId: result.userId,
    auditableType: "User",
    httpMethod: request.method,
    module: "users",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});
