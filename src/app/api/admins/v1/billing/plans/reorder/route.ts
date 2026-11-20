import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { PlanReorderSchema } from "@/server/modules/admin/billing/billing.schemas";
import { reorderAdminPlans } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsManage);
  const { ids } = await parseJsonBody(request, PlanReorderSchema);
  await reorderAdminPlans({ adminId: auth.internalAdminId, request }, ids);
  return apiSuccess({ reordered: true }, context.requestId);
});
