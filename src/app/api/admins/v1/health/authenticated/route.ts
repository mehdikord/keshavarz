import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import {
  mapAuthCheckResponse,
} from "@/server/modules/system/auth-check.mapper";

export const runtime = "nodejs";

export const GET = withApiHandler(
  async (request: NextRequest, context) => {
    const auth = await requireAdminSession(request);

    return apiSuccess(
      mapAuthCheckResponse(auth.adminId, "admins"),
      context.requestId,
    );
  },
);
