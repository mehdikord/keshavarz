import type { NextRequest } from "next/server";

import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { setAppAuthCookies } from "@/server/modules/app-auth/app-auth.cookies";
import { OtpVerifySchema } from "@/server/modules/app-auth/app-auth.schemas";
import { verifyLoginOtp } from "@/server/modules/app-auth/app-auth.service";
import { assertTrustedOrigin } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertTrustedOrigin(
    request,
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const input = await parseJsonBody(request, OtpVerifySchema);
  const result = await verifyLoginOtp(input, request);
  const response = apiSuccess({ userId: result.userId }, context.requestId);
  setAppAuthCookies(response, result);
  return response;
});
