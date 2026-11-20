import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { PlanCreateSchema } from "@/server/modules/admin/billing/billing.schemas";
import { createAdminPlan, listAdminPlans } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsView);
  return apiSuccess(await listAdminPlans(), context.requestId);
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsManage);
  const input = await parseJsonBody(request, PlanCreateSchema);
  const created = await createAdminPlan({ adminId: auth.internalAdminId, request }, input);
  return apiSuccess(created, context.requestId, { status: 201 });
});
