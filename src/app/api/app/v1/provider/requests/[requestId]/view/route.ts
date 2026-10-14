import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  RequestParamsSchema,
  ViewRequestSchema,
} from "@/server/modules/requests/request.schemas";
import { viewProviderServiceRequest } from "@/server/modules/requests/request.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  await parseJsonBody(request, ViewRequestSchema);
  const params = parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-2),
  });
  const result = await viewProviderServiceRequest(
    auth.internalUserId,
    params.requestId,
  );
  return apiSuccess(result, context.requestId);
});
