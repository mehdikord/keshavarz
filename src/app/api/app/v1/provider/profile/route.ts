import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { ProviderProfileUpsertSchema } from "@/server/modules/provider/provider.schemas";
import {
  getCurrentProviderProfile,
  upsertCurrentProviderProfile,
} from "@/server/modules/provider/provider.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const profile = await getCurrentProviderProfile(auth.internalUserId);
  return apiSuccess(profile, context.requestId);
});

export const PUT = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, ProviderProfileUpsertSchema);
  const profile = await upsertCurrentProviderProfile(
    auth.internalUserId,
    input,
  );
  return apiSuccess(profile, context.requestId);
});
