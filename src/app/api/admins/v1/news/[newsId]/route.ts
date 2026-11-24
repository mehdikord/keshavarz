import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { readNewsBody } from "@/server/modules/admin/news/news-admin.input";
import { NewsIdParamsSchema, NewsUpdateSchema } from "@/server/modules/admin/news/news-admin.schemas";
import { deleteAdminNews, updateAdminNews } from "@/server/modules/admin/news/news-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(NewsIdParamsSchema, { newsId: segmentAfter(request, "news") });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.newsManage);
  const { newsId } = params(request);
  const { file, input } = await readNewsBody(request, NewsUpdateSchema);
  await updateAdminNews({ adminId: auth.internalAdminId, request }, newsId, input, file);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.newsManage);
  const { newsId } = params(request);
  await deleteAdminNews({ adminId: auth.internalAdminId, request }, newsId);
  return apiSuccess({ deleted: true }, context.requestId);
});
