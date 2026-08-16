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
  LandCreateSchema,
  LandsQuerySchema,
} from "@/server/modules/lands/lands.schemas";
import {
  createCurrentUserLand,
  listCurrentUserLands,
} from "@/server/modules/lands/lands.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, LandsQuerySchema);
  const result = await listCurrentUserLands(auth.internalUserId, query);
  return apiSuccess({ lands: result.items }, context.requestId, {
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
  const input = await parseJsonBody(request, LandCreateSchema);
  const land = await createCurrentUserLand(auth.internalUserId, input);
  return apiSuccess(land, context.requestId, { status: 201 });
});
