import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { ServiceCreateSchema, ServicesListQuerySchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { createAdminService, listAdminServices } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.catalogView);
  const { items, ...meta } = await listAdminServices(parseQuery(request, ServicesListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const input = await parseJsonBody(request, ServiceCreateSchema);
  const created = await createAdminService({ adminId: auth.internalAdminId, request }, input);
  return apiSuccess(created, context.requestId, { status: 201 });
});
