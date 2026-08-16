import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminUsersQuerySchema } from "@/server/modules/admin-users/admin-users.schemas";
import { listUsersForAdmin } from "@/server/modules/admin-users/admin-users.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "users.view", request);
  const query = parseQuery(request, AdminUsersQuerySchema);
  const result = await listUsersForAdmin({
    cursor: query.cursor,
    isActive: query.isActive,
    limit: query.limit,
    q: query.q,
  });
  return apiSuccess({ users: result.items }, context.requestId, {
    meta: result.meta,
  });
});
