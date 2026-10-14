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
  AdminPermissionOverridesReplaceSchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import { replaceManagedAdminPermissionOverrides } from "@/server/modules/admin-management/admin-management.service";
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
  const input = await parseJsonBody(
    request,
    AdminPermissionOverridesReplaceSchema,
  );
  const admin = await replaceManagedAdminPermissionOverrides({
    actorAdminId: auth.internalAdminId,
    adminId: params.adminId,
    overrides: input.overrides,
  });

  await writeAdminAuditLog({
    action: "admin_permission_overrides_replace",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      adminId: params.adminId,
      overrideCount: input.overrides.length,
    },
    module: "admins",
    newValues: admin,
    request,
  });

  return apiSuccess(admin, context.requestId);
});
