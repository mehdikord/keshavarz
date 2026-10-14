import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminProvidersQuerySchema } from "@/server/modules/admin-providers/admin-providers.schemas";
import { listProvidersForAdmin } from "@/server/modules/admin-providers/admin-providers.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "providers.view", request);
  const query = parseQuery(request, AdminProvidersQuerySchema);
  const result = await listProvidersForAdmin({
    approved: query.approved,
    cursor: query.cursor,
    isActive: query.isActive,
    isAvailable: query.isAvailable,
    limit: query.limit,
    q: query.q,
  });
  return apiSuccess({ providers: result.items }, context.requestId, {
    meta: result.meta,
  });
});
