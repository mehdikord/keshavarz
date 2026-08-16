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
  AdminParamsSchema,
  AdminRolesReplaceSchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import { replaceManagedAdminRoles } from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const PUT = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "admins.manage", request);

  const params = parseWithSchema(AdminParamsSchema, {
    adminId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminRolesReplaceSchema);
  const admin = await replaceManagedAdminRoles({
    actorAdminId: auth.internalAdminId,
    adminId: params.adminId,
    roleIds: input.roleIds,
  });

  await writeAdminAuditLog({
    action: "admin_roles_replace",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      adminId: params.adminId,
      roleIds: input.roleIds,
    },
    module: "admins",
    newValues: admin,
    request,
  });

  return apiSuccess(admin, context.requestId);
});
