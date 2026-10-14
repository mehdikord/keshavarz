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
  AdminUpdateSchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import {
  getManagedAdmin,
  updateManagedAdmin,
} from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function adminIdFromPath(request: NextRequest) {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "admins.view", request);
  const params = parseWithSchema(AdminParamsSchema, {
    adminId: adminIdFromPath(request),
  });
  const admin = await getManagedAdmin(params.adminId);
  return apiSuccess(admin, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "admins.manage", request);

  const params = parseWithSchema(AdminParamsSchema, {
    adminId: adminIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminUpdateSchema);
  const oldAdmin = await getManagedAdmin(params.adminId);
  const admin = await updateManagedAdmin(params.adminId, input);

  await writeAdminAuditLog({
    action: "admin_update",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { adminId: params.adminId },
    module: "admins",
    newValues: admin,
    oldValues: oldAdmin,
    request,
  });

  return apiSuccess(admin, context.requestId);
});
