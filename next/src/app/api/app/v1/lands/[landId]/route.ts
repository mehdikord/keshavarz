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
  LandParamsSchema,
  LandUpdateSchema,
} from "@/server/modules/lands/lands.schemas";
import {
  deleteCurrentUserLand,
  getCurrentUserLand,
  updateCurrentUserLand,
} from "@/server/modules/lands/lands.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function landIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-1);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const params = parseWithSchema(LandParamsSchema, {
    landId: landIdFromPath(request),
  });
  const land = await getCurrentUserLand(auth.internalUserId, params.landId);
  return apiSuccess(land, context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(LandParamsSchema, {
    landId: landIdFromPath(request),
  });
  const input = await parseJsonBody(request, LandUpdateSchema);
  const land = await updateCurrentUserLand(
    auth.internalUserId,
    params.landId,
    input,
  );
  return apiSuccess(land, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(LandParamsSchema, {
    landId: landIdFromPath(request),
  });
  const result = await deleteCurrentUserLand(
    auth.internalUserId,
    params.landId,
  );
  return apiSuccess(result, context.requestId);
});
