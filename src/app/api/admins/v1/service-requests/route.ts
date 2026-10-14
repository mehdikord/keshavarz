import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminServiceRequestsQuerySchema } from "@/server/modules/requests/request.schemas";
import { listAdminManagedServiceRequests } from "@/server/modules/requests/request.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "requests.view", request);
  const query = parseQuery(request, AdminServiceRequestsQuerySchema);
  const result = await listAdminManagedServiceRequests({
    consumerUserId: query.consumerUserId,
    cursor: query.cursor,
    limit: query.limit,
    q: query.q,
    status: query.status,
  });
  return apiSuccess({ requests: result.items }, context.requestId, {
    meta: result.meta,
  });
});
