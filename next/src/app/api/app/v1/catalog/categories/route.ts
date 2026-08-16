import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { getCatalogCategories } from "@/server/modules/catalog/catalog.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireUserSession(request);
  const categories = await getCatalogCategories();
  return apiSuccess(
    { categories },
    context.requestId,
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
});
