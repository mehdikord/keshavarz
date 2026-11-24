import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { readNewsBody } from "@/server/modules/admin/news/news-admin.input";
import { NewsCreateSchema, NewsListQuerySchema } from "@/server/modules/admin/news/news-admin.schemas";
import { createAdminNews, listAdminNews } from "@/server/modules/admin/news/news-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.newsView);
  const { items, ...meta } = await listAdminNews(parseQuery(request, NewsListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.newsManage);
  const { file, input } = await readNewsBody(request, NewsCreateSchema);
  const created = await createAdminNews({ adminId: auth.internalAdminId, request }, input, file);
  return apiSuccess(created, context.requestId, { status: 201 });
});
