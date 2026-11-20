import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { ServiceReorderSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { reorderAdminServices } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { categoryId, ids } = await parseJsonBody(request, ServiceReorderSchema);
  await reorderAdminServices({ adminId: auth.internalAdminId, request }, categoryId, ids);
  return apiSuccess({ reordered: true }, context.requestId);
});
