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
import {
  RoleParamsSchema,
  RoleUpdateSchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import {
  deleteManagedRole,
  updateManagedRole,
} from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function roleIdFromPath(request: NextRequest) {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.manage", request);

  const params = parseWithSchema(RoleParamsSchema, {
    roleId: roleIdFromPath(request),
  });
  const input = await parseJsonBody(request, RoleUpdateSchema);
  const role = await updateManagedRole(params.roleId, input);

  await writeAdminAuditLog({
    action: "role_update",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { roleId: params.roleId },
    module: "roles",
    newValues: role,
    request,
  });

  return apiSuccess(role, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.manage", request);

  const params = parseWithSchema(RoleParamsSchema, {
    roleId: roleIdFromPath(request),
  });
  const result = await deleteManagedRole(params.roleId);

  await writeAdminAuditLog({
    action: "role_delete",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { roleId: params.roleId },
    module: "roles",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
