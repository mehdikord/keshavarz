import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { RequestsListQuerySchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { listAdminRequests } from "@/server/modules/admin/requests/requests-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.requestsView);
  const { items, ...meta } = await listAdminRequests(parseQuery(request, RequestsListQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});
