import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { SessionParamsSchema } from "@/server/modules/app-auth/app-auth.schemas";
import { revokeOtherUserSession } from "@/server/modules/app-auth/app-auth.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(request, "app", new Set([getSecurityEnvironment().APP_ORIGIN]));
  const auth = await requireUserSession(request);
  const sessionId = request.nextUrl.pathname.split("/").at(-1);
  const params = parseWithSchema(SessionParamsSchema, { sessionId });
  await revokeOtherUserSession({
    currentSessionId: auth.sessionId,
    publicSessionId: params.sessionId,
    userId: auth.internalUserId,
  });
  return apiSuccess({ revoked: true }, context.requestId);
});
