import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminCreateSubscriptionPlanSchema,
  AdminSubscriptionPlansQuerySchema,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import {
  createSubscriptionPlanForAdmin,
  listSubscriptionPlansForAdmin,
} from "@/server/modules/admin-subscriptions/admin-subscriptions.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.view", request);
  const query = parseQuery(request, AdminSubscriptionPlansQuerySchema);
  const plans = await listSubscriptionPlansForAdmin({
    includeDeleted: query.includeDeleted ?? false,
    isActive: query.isActive,
  });
  return apiSuccess({ plans }, context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.manage", request);
  const input = await parseJsonBody(request, AdminCreateSubscriptionPlanSchema);

  const plan = await createSubscriptionPlanForAdmin(auth.internalAdminId, {
    code: input.code,
    description: input.description,
    durationMonths: input.durationMonths,
    features: input.features,
    isActive: input.isActive,
    isRecommended: input.isRecommended,
    name: input.name,
    priceToman: input.priceToman,
    sortOrder: input.sortOrder,
  });

  await writeAdminAuditLog({
    action: "subscription_plan_create",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { planId: plan.planId },
    module: "subscriptions",
    newValues: plan,
    request,
  });

  return apiSuccess(plan, context.requestId, { status: 201 });
});
