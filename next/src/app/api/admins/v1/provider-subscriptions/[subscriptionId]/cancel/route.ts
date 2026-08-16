import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
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
  AdminCancelSubscriptionSchema,
  SubscriptionParamsSchema,
} from "@/server/modules/subscriptions/subscriptions.schemas";
import { cancelProviderSubscriptionByAdmin } from "@/server/modules/subscriptions/subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.manage", request);

  const params = parseWithSchema(SubscriptionParamsSchema, {
    subscriptionId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminCancelSubscriptionSchema);
  const result = await cancelProviderSubscriptionByAdmin({
    reason: input.reason,
    subscriptionId: params.subscriptionId,
  });

  await writeAdminAuditLog({
    action: "subscription_cancel",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      reason: input.reason,
      subscriptionId: result.subscriptionId,
    },
    module: "subscriptions",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
