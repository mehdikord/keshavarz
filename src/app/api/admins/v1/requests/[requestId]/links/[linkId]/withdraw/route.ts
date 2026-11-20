import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { RequestLinkParamsSchema, RequestWithdrawSchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { withdrawAdminRequestLink } from "@/server/modules/admin/requests/requests-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.requestsManage);
  const { linkId, requestId } = parseWithSchema(RequestLinkParamsSchema, {
    linkId: segmentAfter(request, "links"),
    requestId: segmentAfter(request, "requests"),
  });
  const input = await parseJsonBody(request, RequestWithdrawSchema);
  const result = await withdrawAdminRequestLink({ adminId: auth.internalAdminId, request }, requestId, linkId, input);
  return apiSuccess(result, context.requestId);
});
