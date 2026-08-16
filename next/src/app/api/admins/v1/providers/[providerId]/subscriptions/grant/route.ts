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
  AdminGrantSubscriptionSchema,
  IdempotencyHeaderSchema,
  ProviderParamsSchema,
} from "@/server/modules/subscriptions/subscriptions.schemas";
import { grantProviderSubscription } from "@/server/modules/subscriptions/subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.grant", request);

  const params = parseWithSchema(ProviderParamsSchema, {
    providerId: request.nextUrl.pathname.split("/").at(-3),
  });
  const input = await parseJsonBody(request, AdminGrantSubscriptionSchema);
  const idempotencyKey = parseWithSchema(
    IdempotencyHeaderSchema,
    request.headers.get(API_HEADERS.idempotencyKey),
  );

  const subscription = await grantProviderSubscription({
    adminId: auth.internalAdminId,
    durationMonths: input.durationMonths,
    idempotencyKey,
    planCode: input.planCode,
    providerPublicId: params.providerId,
    reason: input.reason,
  });

  await writeAdminAuditLog({
    action: "subscription_grant",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      durationMonths: input.durationMonths ?? null,
      planCode: input.planCode,
      providerId: params.providerId,
      reason: input.reason ?? null,
      subscriptionId: subscription.subscriptionId,
    },
    module: "subscriptions",
    newValues: subscription,
    request,
  });

  return apiSuccess(subscription, context.requestId, { status: 201 });
});
