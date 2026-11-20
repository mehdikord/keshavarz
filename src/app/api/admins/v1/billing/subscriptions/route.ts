import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { SubscriptionGrantSchema, SubscriptionsListQuerySchema } from "@/server/modules/admin/billing/billing.schemas";
import { grantAdminSubscription, listAdminSubscriptions } from "@/server/modules/admin/billing/billing.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsView);
  const { items, ...meta } = await listAdminSubscriptions(parseQuery(request, SubscriptionsListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});

/** Grant a subscription to a provider. */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.subscriptionsGrant);
  const input = await parseJsonBody(request, SubscriptionGrantSchema);
  const result = await grantAdminSubscription({ adminId: auth.internalAdminId, request }, input);
  return apiSuccess(result, context.requestId, { status: 201 });
});
