import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { API_HEADERS } from "@/server/contracts";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminRefundSchema,
  IdempotencyHeaderSchema,
  PaymentParamsSchema,
} from "@/server/modules/subscriptions/subscriptions.schemas";
import { refundPaymentByAdmin } from "@/server/modules/subscriptions/subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "payments.refund", request);

  const params = parseWithSchema(PaymentParamsSchema, {
    paymentId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminRefundSchema);
  const idempotencyKey = parseWithSchema(
    IdempotencyHeaderSchema,
    request.headers.get(API_HEADERS.idempotencyKey),
  );

  const result = await refundPaymentByAdmin({
    adminId: auth.internalAdminId,
    amountToman: input.amountToman,
    idempotencyKey,
    paymentId: params.paymentId,
    reason: input.reason,
  });

  await writeAdminAuditLog({
    action: "payment_refund",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      amountToman: input.amountToman,
      paymentId: result.paymentId,
      paymentStatus: result.paymentStatus,
      reason: input.reason,
      refundId: result.refund.refundId,
    },
    module: "payments",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId, { status: 201 });
});
