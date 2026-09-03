import type { NextRequest } from "next/server";

import { apiSuccess, withApiHandler } from "@/server/http";
import { getProvinces } from "@/server/modules/location/location.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (_request: NextRequest, context) => {
  const provinces = await getProvinces();

  return apiSuccess(
    { provinces },
    context.requestId,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    },
  );
});
