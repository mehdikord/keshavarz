import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { RequestParamsSchema } from "@/server/modules/requests/request.schemas";
import { getConsumerServiceRequest } from "@/server/modules/requests/request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const params = parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-1),
  });
  const result = await getConsumerServiceRequest(
    auth.internalUserId,
    params.requestId,
  );
  return apiSuccess(result, context.requestId);
});
