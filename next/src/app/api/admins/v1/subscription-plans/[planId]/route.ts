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
  AdminPlanParamsSchema,
  AdminUpdateSubscriptionPlanSchema,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import {
  deleteSubscriptionPlanForAdmin,
  updateSubscriptionPlanForAdmin,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.manage", request);

  const params = parseWithSchema(AdminPlanParamsSchema, {
    planId: request.nextUrl.pathname.split("/").at(-1),
  });
  const input = await parseJsonBody(request, AdminUpdateSubscriptionPlanSchema);
  const plan = await updateSubscriptionPlanForAdmin(
    auth.internalAdminId,
    params.planId,
    input,
  );

  await writeAdminAuditLog({
    action: "subscription_plan_update",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { planId: plan.planId },
    module: "subscriptions",
    newValues: plan,
    request,
  });

  return apiSuccess(plan, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.manage", request);

  const params = parseWithSchema(AdminPlanParamsSchema, {
    planId: request.nextUrl.pathname.split("/").at(-1),
  });
  const plan = await deleteSubscriptionPlanForAdmin(
    auth.internalAdminId,
    params.planId,
  );

  await writeAdminAuditLog({
    action: "subscription_plan_delete",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { planId: plan.planId },
    module: "subscriptions",
    newValues: plan,
    request,
  });

  return apiSuccess(plan, context.requestId);
});
