import type { NextRequest } from "next/server";

import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  GatewayParamsSchema,
  PaymentCallbackSchema,
} from "@/server/modules/subscriptions/subscriptions.schemas";
import { handlePaymentGatewayCallback } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const params = parseWithSchema(GatewayParamsSchema, {
    gateway: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, PaymentCallbackSchema);
  const result = await handlePaymentGatewayCallback(params.gateway, input);
  return apiSuccess(result, context.requestId);
});
