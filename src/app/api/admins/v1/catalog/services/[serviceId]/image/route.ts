import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { readImageFormField } from "@/server/media/image-upload";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ServiceIdParamsSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { removeCatalogImage, uploadCatalogImage } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(ServiceIdParamsSchema, { serviceId: segmentAfter(request, "services") });
}

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { serviceId } = params(request);
  const file = await readImageFormField(request);
  const result = await uploadCatalogImage({ adminId: auth.internalAdminId, request }, "service", serviceId, file);
  return apiSuccess(result, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { serviceId } = params(request);
  await removeCatalogImage({ adminId: auth.internalAdminId, request }, "service", serviceId);
  return apiSuccess({ deleted: true }, context.requestId);
});
