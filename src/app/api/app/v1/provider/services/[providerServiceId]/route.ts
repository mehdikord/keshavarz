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
  ProviderServiceParamsSchema,
  ProviderServiceUpdateSchema,
} from "@/server/modules/provider/provider.schemas";
import {
  deactivateCurrentProviderService,
  updateCurrentProviderService,
} from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function providerServiceIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(ProviderServiceParamsSchema, {
    providerServiceId: providerServiceIdFromPath(request),
  });
  const input = await parseJsonBody(request, ProviderServiceUpdateSchema);
  const service = await updateCurrentProviderService(
    auth.internalUserId,
    params.providerServiceId,
    input,
  );
  return apiSuccess(service, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(ProviderServiceParamsSchema, {
    providerServiceId: providerServiceIdFromPath(request),
  });
  const result = await deactivateCurrentProviderService(
    auth.internalUserId,
    params.providerServiceId,
  );
  return apiSuccess(result, context.requestId);
});
