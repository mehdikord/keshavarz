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
  AcceptRequestSchema,
  RequestParamsSchema,
} from "@/server/modules/requests/request.schemas";
import { acceptProviderServiceRequest } from "@/server/modules/requests/request.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AcceptRequestSchema);
  const result = await acceptProviderServiceRequest(
    auth.internalUserId,
    params.requestId,
    input,
  );
  return apiSuccess(result, context.requestId);
});
