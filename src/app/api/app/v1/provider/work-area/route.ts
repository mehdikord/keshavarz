import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { ProviderWorkAreaSchema } from "@/server/modules/provider/provider.schemas";
import { patchCurrentProviderWorkArea } from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, ProviderWorkAreaSchema);
  const profile = await patchCurrentProviderWorkArea(
    auth.internalUserId,
    input,
  );
  return apiSuccess(profile, context.requestId);
});
