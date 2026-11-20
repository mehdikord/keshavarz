import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { CategoriesListQuerySchema, CategoryCreateSchema } from "@/server/modules/admin/catalog/catalog-admin.schemas";
import { createAdminCategory, listAdminCategories } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.catalogView);
  const { counts, items } = await listAdminCategories(parseQuery(request, CategoriesListQuerySchema));
  return apiSuccess(items, context.requestId, { meta: { counts } });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const input = await parseJsonBody(request, CategoryCreateSchema);
  const created = await createAdminCategory({ adminId: auth.internalAdminId, request }, input);
  return apiSuccess(created, context.requestId, { status: 201 });
});
