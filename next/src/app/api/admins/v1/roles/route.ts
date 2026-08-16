import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { RoleCreateSchema } from "@/server/modules/admin-management/admin-management.schemas";
import {
  createManagedRole,
  listManagedRoles,
} from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.view", request);
  const roles = await listManagedRoles();
  return apiSuccess({ roles }, context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "roles.manage", request);
  const input = await parseJsonBody(request, RoleCreateSchema);

  const role = await createManagedRole({
    actorAdminId: auth.internalAdminId,
    code: input.code,
    description: input.description,
    name: input.name,
  });

  await writeAdminAuditLog({
    action: "role_create",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { roleId: role.roleId },
    module: "roles",
    newValues: role,
    request,
  });

  return apiSuccess(role, context.requestId, { status: 201 });
});
