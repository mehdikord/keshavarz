import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { PaymentParamsSchema } from "@/server/modules/subscriptions/subscriptions.schemas";
import { getCurrentUserPayment } from "@/server/modules/subscriptions/subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const params = parseWithSchema(PaymentParamsSchema, {
    paymentId: request.nextUrl.pathname.split("/").at(-1),
  });
  const payment = await getCurrentUserPayment(
    auth.internalUserId,
    params.paymentId,
  );
  return apiSuccess(payment, context.requestId);
});
