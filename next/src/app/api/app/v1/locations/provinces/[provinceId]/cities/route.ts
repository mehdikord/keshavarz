import type { NextRequest } from "next/server";

import {
  apiSuccess,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  ProvinceIdParamSchema,
} from "@/server/modules/location/location.schemas";
import {
  getCitiesForProvince,
} from "@/server/modules/location/location.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const rawProvinceId = request.nextUrl.pathname.split("/").at(-2);
  const params = parseWithSchema(ProvinceIdParamSchema, {
    provinceId: rawProvinceId,
  });
  const cities = await getCitiesForProvince(params.provinceId);

  return apiSuccess(
    { cities },
    context.requestId,
    {
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    },
  );
});
