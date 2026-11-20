import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { CategoryIdParamsSchema, CategoryUpdateSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { deleteAdminCategory, updateAdminCategory } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(CategoryIdParamsSchema, { categoryId: segmentAfter(request, "categories") });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { categoryId } = params(request);
  const input = await parseJsonBody(request, CategoryUpdateSchema);
  await updateAdminCategory({ adminId: auth.internalAdminId, request }, categoryId, input);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const { categoryId } = params(request);
  await deleteAdminCategory({ adminId: auth.internalAdminId, request }, categoryId);
  return apiSuccess({ deleted: true }, context.requestId);
});
