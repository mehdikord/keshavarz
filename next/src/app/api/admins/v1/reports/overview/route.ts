import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { AdminReportsQuerySchema } from "@/server/modules/reports/reports.schemas";
import { getAdminReportsOverview } from "@/server/modules/reports/reports.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "reports.view", request);
  const query = parseQuery(request, AdminReportsQuerySchema);
  const data = await getAdminReportsOverview(query);
  return apiSuccess(data, context.requestId);
});
