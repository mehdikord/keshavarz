import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { API_HEADERS } from "@/server/contracts";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  CreateServiceRequestSchema,
  IdempotencyHeaderSchema,
} from "@/server/modules/requests/request.schemas";
import { createServiceRequestFromSearch } from "@/server/modules/requests/request.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, CreateServiceRequestSchema);
  const idempotencyKey = parseWithSchema(
    IdempotencyHeaderSchema,
    request.headers.get(API_HEADERS.idempotencyKey),
  );
  const result = await createServiceRequestFromSearch(
    auth.internalUserId,
    input,
    idempotencyKey,
  );
  return apiSuccess(result, context.requestId, { status: 201 });
});
