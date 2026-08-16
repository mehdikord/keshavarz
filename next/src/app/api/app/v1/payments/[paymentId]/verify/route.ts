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
  PaymentParamsSchema,
  PaymentVerifySchema,
} from "@/server/modules/subscriptions/subscriptions.schemas";
import { verifyCurrentUserPayment } from "@/server/modules/subscriptions/subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  await parseJsonBody(request, PaymentVerifySchema);
  const params = parseWithSchema(PaymentParamsSchema, {
    paymentId: request.nextUrl.pathname.split("/").at(-2),
  });
  const payment = await verifyCurrentUserPayment(
    auth.internalUserId,
    params.paymentId,
  );
  return apiSuccess(payment, context.requestId);
});
