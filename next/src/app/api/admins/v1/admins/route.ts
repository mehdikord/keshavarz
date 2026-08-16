import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import {
  AdminCreateSchema,
  AdminsQuerySchema,
} from "@/server/modules/admin-management/admin-management.schemas";
import {
  createManagedAdmin,
  listManagedAdmins,
} from "@/server/modules/admin-management/admin-management.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "admins.view", request);
  const query = parseQuery(request, AdminsQuerySchema);
  const result = await listManagedAdmins({
    cursor: query.cursor,
    isActive: query.isActive,
    limit: query.limit,
    q: query.q,
  });
  return apiSuccess({ admins: result.items }, context.requestId, {
    meta: result.meta,
  });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "admins.manage", request);
  const input = await parseJsonBody(request, AdminCreateSchema);

  const admin = await createManagedAdmin({
    actorAdminId: auth.internalAdminId,
    email: input.email,
    isSuperAdmin: input.isSuperAdmin,
    name: input.name,
    password: input.password,
    phone: input.phone,
  });

  await writeAdminAuditLog({
    action: "admin_create",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      adminId: admin.adminId,
      isSuperAdmin: admin.isSuperAdmin,
      phone: admin.phone,
    },
    module: "admins",
    newValues: admin,
    request,
  });

  return apiSuccess(admin, context.requestId, { status: 201 });
});
