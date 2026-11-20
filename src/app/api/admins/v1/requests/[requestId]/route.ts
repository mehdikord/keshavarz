import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { RequestParamsSchema } from "@/server/modules/admin/requests/requests-admin.schemas";
import { getAdminRequestDetail } from "@/server/modules/admin/requests/requests-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.requestsView);
  const { requestId } = parseWithSchema(RequestParamsSchema, { requestId: segmentAfter(request, "requests") });
  const detail = await getAdminRequestDetail(requestId);
  if (!detail) throw new ApiError(404, API_ERROR_CODES.notFound, "درخواست پیدا نشد.");
  return apiSuccess(detail, context.requestId);
});
