import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { PaymentParamsSchema, PaymentRefundSchema } from "@/server/modules/admin/billing/billing.schemas";
import { refundAdminPayment } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

/** Records a manual refund (the gateway has no refund API). */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.paymentsRefund);
  const { paymentId } = parseWithSchema(PaymentParamsSchema, { paymentId: segmentAfter(request, "payments") });
  const input = await parseJsonBody(request, PaymentRefundSchema);
  const result = await refundAdminPayment({ adminId: auth.internalAdminId, request }, paymentId, input);
  return apiSuccess(result, context.requestId, { status: 201 });
});
