import type { NextRequest } from "next/server";

import { apiSuccess, withApiHandler } from "@/server/http";
import {
  mapHealthResponse,
} from "@/server/modules/system/health.mapper";
import {
  getApiHealth,
} from "@/server/modules/system/health.service";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (_request: NextRequest, context) => {
    const health = await getApiHealth();

    return apiSuccess(mapHealthResponse(health), context.requestId, {
      headers: { "Cache-Control": "no-store" },
    });
  },
);
