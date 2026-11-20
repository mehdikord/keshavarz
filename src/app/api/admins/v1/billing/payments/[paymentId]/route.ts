import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { PaymentParamsSchema } from "@/server/modules/admin/billing/billing.schemas";
import { getAdminPayment } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.paymentsView);
  const { paymentId } = parseWithSchema(PaymentParamsSchema, { paymentId: segmentAfter(request, "payments") });
  const payment = await getAdminPayment(paymentId);
  if (!payment) throw new ApiError(404, API_ERROR_CODES.notFound, "پرداخت پیدا نشد.");
  return apiSuccess(payment, context.requestId);
});
