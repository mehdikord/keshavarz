import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { API_HEADERS } from "@/server/contracts";
import { getAllowedOrigins } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  AddRequestProvidersSchema,
  IdempotencyHeaderSchema,
  RequestParamsSchema,
} from "@/server/modules/requests/request.schemas";
import { sendRequestToProviders } from "@/server/modules/requests/request.service";
import { listRequestCandidates } from "@/server/modules/search/search.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function parseRequestId(request: NextRequest) {
  return parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-2),
  }).requestId;
}

/** Every provider found for the request, with its live state. */
export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const result = await listRequestCandidates(
    auth.internalUserId,
    parseRequestId(request),
  );
  return apiSuccess(result, context.requestId);
});

/** Send the request to more providers (revalidated live, partial success). */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    getAllowedOrigins("app"),
  );
  const auth = await requireUserSession(request);
  const requestId = parseRequestId(request);
  const input = await parseJsonBody(request, AddRequestProvidersSchema);
  const idempotencyKey = parseWithSchema(
    IdempotencyHeaderSchema,
    request.headers.get(API_HEADERS.idempotencyKey),
  );
  const result = await sendRequestToProviders(
    auth.internalUserId,
    requestId,
    input.providerIds,
    idempotencyKey,
  );
  return apiSuccess(result, context.requestId);
});
