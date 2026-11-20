import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderParamsSchema, ProviderProfileUpdateSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { getAdminProviderDetail, updateAdminProviderProfile } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(ProviderParamsSchema, { providerId: segmentAfter(request, "providers") });
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.providersView);
  const detail = await getAdminProviderDetail(params(request).providerId);
  if (!detail) throw new ApiError(404, API_ERROR_CODES.notFound, "خدمات‌دهنده پیدا نشد.");
  return apiSuccess(detail, context.requestId);
});

/** Bio and availability. */
export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { providerId } = params(request);
  const input = await parseJsonBody(request, ProviderProfileUpdateSchema);
  await updateAdminProviderProfile({ adminId: auth.internalAdminId, request }, providerId, input);
  return apiSuccess({ updated: true }, context.requestId);
});
