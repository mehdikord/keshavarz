import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminProviderSubscriptionsQuerySchema } from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import { listProviderSubscriptionsForAdmin } from "@/server/modules/admin-subscriptions/admin-subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "subscriptions.view", request);
  const query = parseQuery(request, AdminProviderSubscriptionsQuerySchema);
  const result = await listProviderSubscriptionsForAdmin({
    cursor: query.cursor,
    limit: query.limit,
    providerId: query.providerId,
    status: query.status,
  });
  return apiSuccess({ subscriptions: result.items }, context.requestId, {
    meta: result.meta,
  });
});
