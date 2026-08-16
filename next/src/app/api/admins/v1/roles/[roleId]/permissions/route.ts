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
  RolePermissionsReplaceSchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import {
  getManagedRolePermissions,
  replaceManagedRolePermissions,
} from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function roleIdFromPermissionsPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-2);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.view", request);
  const params = parseWithSchema(RoleParamsSchema, {
    roleId: roleIdFromPermissionsPath(request),
  });
  const result = await getManagedRolePermissions(params.roleId);
  return apiSuccess(result, context.requestId);
});

export const PUT = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.manage", request);

  const params = parseWithSchema(RoleParamsSchema, {
    roleId: roleIdFromPermissionsPath(request),
  });
  const input = await parseJsonBody(request, RolePermissionsReplaceSchema);
  const result = await replaceManagedRolePermissions({
    actorAdminId: auth.internalAdminId,
    permissionCodes: input.permissionCodes,
    roleId: params.roleId,
  });

  await writeAdminAuditLog({
    action: "role_permissions_replace",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      permissionCount: input.permissionCodes.length,
      roleId: params.roleId,
    },
    module: "roles",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
