import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { CategoryParamsSchema } from "@/server/modules/catalog/catalog.schemas";
import { getCatalogCategoryServices } from "@/server/modules/catalog/catalog.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireUserSession(request);
  const categoryId = request.nextUrl.pathname.split("/").at(-2);
  const params = parseWithSchema(CategoryParamsSchema, { categoryId });
  const services = await getCatalogCategoryServices(params.categoryId);
  return apiSuccess(
    { services },
    context.requestId,
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
});
