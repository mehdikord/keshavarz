import type { NextRequest } from "next/server";

import { apiSuccess, withApiHandler } from "@/server/http";
import { getPublicSettings } from "@/server/modules/system/public-settings.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const result = await getPublicSettings();

  return apiSuccess(result, context.requestId, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
    },
  });
});
