import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { SubscriptionExtendSchema, SubscriptionParamsSchema } from "@/server/modules/admin/billing/billing.schemas";
import { extendAdminSubscription } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsManage);
  const { subscriptionId } = parseWithSchema(SubscriptionParamsSchema, { subscriptionId: segmentAfter(request, "subscriptions") });
  const input = await parseJsonBody(request, SubscriptionExtendSchema);
  const result = await extendAdminSubscription({ adminId: auth.internalAdminId, request }, subscriptionId, input);
  return apiSuccess(result, context.requestId);
});
