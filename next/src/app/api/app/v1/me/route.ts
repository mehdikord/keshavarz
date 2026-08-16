import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { ProfileUpdateSchema } from "@/server/modules/app-auth/app-auth.schemas";
import { mapCurrentUserProfile } from "@/server/modules/app-profile/app-profile.mapper";
import {
  patchCurrentUserProfile,
  requireCurrentUserProfile,
} from "@/server/modules/app-profile/app-profile.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const profile = await requireCurrentUserProfile(auth.internalUserId);
  return apiSuccess(mapCurrentUserProfile(profile), context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "app", new Set([getSecurityEnvironment().APP_ORIGIN]));
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, ProfileUpdateSchema);
  const profile = await patchCurrentUserProfile(auth.internalUserId, input);
  return apiSuccess(mapCurrentUserProfile(profile), context.requestId);
});
