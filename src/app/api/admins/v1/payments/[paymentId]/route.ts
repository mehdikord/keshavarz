import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminPaymentParamsSchema } from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import { getPaymentForAdmin } from "@/server/modules/admin-subscriptions/admin-subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "payments.view", request);

  const params = parseWithSchema(AdminPaymentParamsSchema, {
    paymentId: request.nextUrl.pathname.split("/").at(-1),
  });
  const payment = await getPaymentForAdmin(params.paymentId);
  return apiSuccess(payment, context.requestId);
});
