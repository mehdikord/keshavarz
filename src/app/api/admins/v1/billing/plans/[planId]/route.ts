import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { PlanParamsSchema, PlanUpdateSchema } from "@/server/modules/admin/billing/billing.schemas";
import { deleteAdminPlan, updateAdminPlan } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(PlanParamsSchema, { planId: segmentAfter(request, "plans") });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsManage);
  const { planId } = params(request);
  const input = await parseJsonBody(request, PlanUpdateSchema);
  await updateAdminPlan({ adminId: auth.internalAdminId, request }, planId, input);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsManage);
  const { planId } = params(request);
  await deleteAdminPlan({ adminId: auth.internalAdminId, request }, planId);
  return apiSuccess({ deleted: true }, context.requestId);
});
