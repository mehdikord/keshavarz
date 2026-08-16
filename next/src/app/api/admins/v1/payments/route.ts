import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminPaymentsQuerySchema } from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import { listPaymentsForAdmin } from "@/server/modules/admin-subscriptions/admin-subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "payments.view", request);
  const query = parseQuery(request, AdminPaymentsQuerySchema);
  const result = await listPaymentsForAdmin({
    cursor: query.cursor,
    limit: query.limit,
    status: query.status,
    userId: query.userId,
  });
  return apiSuccess({ payments: result.items }, context.requestId, {
    meta: result.meta,
  });
});
