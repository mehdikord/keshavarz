import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminDashboardQuerySchema } from "@/server/modules/admin-dashboard/dashboard.schemas";
import { getAdminDashboard } from "@/server/modules/admin-dashboard/dashboard.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "dashboard.view", request);
  const query = parseQuery(request, AdminDashboardQuerySchema);
  const data = await getAdminDashboard({
    from: query.from,
    to: query.to,
  });
  return apiSuccess(data, context.requestId);
});
