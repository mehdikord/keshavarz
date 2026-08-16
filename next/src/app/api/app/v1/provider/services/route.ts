import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  withApiHandler,
} from "@/server/http";
import {
  ProviderServiceCreateSchema,
  ProviderServicesQuerySchema,
} from "@/server/modules/provider/provider.schemas";
import {
  addCurrentProviderService,
  listCurrentProviderServices,
} from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, ProviderServicesQuerySchema);
  const result = await listCurrentProviderServices(
    auth.internalUserId,
    query,
  );
  return apiSuccess({ services: result.items }, context.requestId, {
    meta: result.meta,
  });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, ProviderServiceCreateSchema);
  const service = await addCurrentProviderService(auth.internalUserId, input);
  return apiSuccess(service, context.requestId, { status: 201 });
});
