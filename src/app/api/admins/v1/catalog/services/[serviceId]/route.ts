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
  AdminServiceParamsSchema,
  AdminServiceUpdateSchema,
} from "@/server/modules/admin-catalog/admin-catalog.schemas";
import {
  deleteServiceForAdmin,
  updateServiceForAdmin,
} from "@/server/modules/admin-catalog/admin-catalog.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function serviceIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const params = parseWithSchema(AdminServiceParamsSchema, {
    serviceId: serviceIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminServiceUpdateSchema);
  const result = await updateServiceForAdmin(
    params.serviceId,
    auth.internalAdminId,
    input,
  );

  await writeAdminAuditLog({
    action: "catalog_service_update",
    adminId: auth.internalAdminId,
    auditableId: result.serviceId,
    auditableType: "Service",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const params = parseWithSchema(AdminServiceParamsSchema, {
    serviceId: serviceIdFromPath(request),
  });
  const result = await deleteServiceForAdmin(
    params.serviceId,
    auth.internalAdminId,
  );

  await writeAdminAuditLog({
    action: "catalog_service_delete",
    adminId: auth.internalAdminId,
    auditableId: result.serviceId,
    auditableType: "Service",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    oldValues: result.oldValues,
    request,
  });

  return apiSuccess({ deleted: true }, context.requestId);
});
