import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { RequestCompleteSchema, RequestParamsSchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { completeAdminRequest } from "@/server/modules/admin/requests/requests-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.requestsManage);
  const { requestId } = parseWithSchema(RequestParamsSchema, { requestId: segmentAfter(request, "requests") });
  const input = await parseJsonBody(request, RequestCompleteSchema);
  const result = await completeAdminRequest({ adminId: auth.internalAdminId, request }, requestId, input);
  return apiSuccess(result, context.requestId);
});
