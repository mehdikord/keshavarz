import type { NextRequest } from "next/server";

import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import {
  OtpRequestSchema,
} from "@/server/modules/app-auth/app-auth.schemas";
import { requestLoginOtp } from "@/server/modules/app-auth/app-auth.service";
import { assertTrustedOrigin } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertTrustedOrigin(
    request,
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const input = await parseJsonBody(request, OtpRequestSchema);
  return apiSuccess(await requestLoginOtp(input, request), context.requestId);
});
