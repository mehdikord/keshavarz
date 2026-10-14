import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminRefundsQuerySchema } from "@/server/modules/admin-subscriptions/admin-subscriptions.schemas";
import { listRefundsForAdmin } from "@/server/modules/admin-subscriptions/admin-subscriptions.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "payments.view", request);
  const query = parseQuery(request, AdminRefundsQuerySchema);
  const result = await listRefundsForAdmin({
    cursor: query.cursor,
    limit: query.limit,
    status: query.status,
  });
  return apiSuccess({ refunds: result.items }, context.requestId, {
    meta: result.meta,
  });
});
