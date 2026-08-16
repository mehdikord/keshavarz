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
  CreateServiceSearchSchema,
  IdempotencyHeaderSchema,
} from "@/server/modules/search/search.schemas";
import { createServiceSearch } from "@/server/modules/search/search.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, CreateServiceSearchSchema);
  const idempotencyKey = parseWithSchema(
    IdempotencyHeaderSchema,
    request.headers.get(API_HEADERS.idempotencyKey),
  );
  const search = await createServiceSearch(
    auth.internalUserId,
    input,
    idempotencyKey,
  );
  return apiSuccess(search, context.requestId, { status: 201 });
});
