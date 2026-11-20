import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ServiceIdParamsSchema, ServiceUpdateSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { deleteAdminService, updateAdminService } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(ServiceIdParamsSchema, { serviceId: segmentAfter(request, "services") });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { serviceId } = params(request);
  const input = await parseJsonBody(request, ServiceUpdateSchema);
  await updateAdminService({ adminId: auth.internalAdminId, request }, serviceId, input);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { serviceId } = params(request);
  await deleteAdminService({ adminId: auth.internalAdminId, request }, serviceId);
  return apiSuccess({ deleted: true }, context.requestId);
});
