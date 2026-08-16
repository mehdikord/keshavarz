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
  AdminCatalogServicesQuerySchema,
  AdminServiceCreateSchema,
} from "@/server/modules/admin-catalog/admin-catalog.schemas";
import {
  createServiceForAdmin,
  listServicesForAdmin,
} from "@/server/modules/admin-catalog/admin-catalog.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.view", request);
  const query = parseQuery(request, AdminCatalogServicesQuerySchema);
  const services = await listServicesForAdmin({
    categoryId: query.categoryId,
    isActive: query.isActive,
  });
  return apiSuccess({ services }, context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "catalog.manage", request);
  const input = await parseJsonBody(request, AdminServiceCreateSchema);
  const result = await createServiceForAdmin({
    adminId: auth.internalAdminId,
    categoryId: input.categoryId,
    description: input.description,
    image: input.image,
    isActive: input.isActive,
    name: input.name,
    slug: input.slug,
    sortOrder: input.sortOrder,
  });

  await writeAdminAuditLog({
    action: "catalog_service_create",
    adminId: auth.internalAdminId,
    auditableId: result.serviceId,
    auditableType: "Service",
    httpMethod: request.method,
    module: "catalog",
    newValues: result.newValues,
    request,
  });

  return apiSuccess(result.newValues, context.requestId, { status: 201 });
});
