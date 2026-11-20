import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import {
  ProviderServiceParamsSchema,
  ProviderServiceUpdateSchema,
} from "@/server/modules/admin/providers/providers-admin.schemas";
import {
  deleteAdminProviderService,
  updateAdminProviderService,
} from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

function params(request: NextRequest) {
  return parseWithSchema(ProviderServiceParamsSchema, {
    providerId: segmentAfter(request, "providers"),
    providerServiceId: segmentAfter(request, "services"),
  });
}

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { providerId, providerServiceId } = params(request);
  const input = await parseJsonBody(request, ProviderServiceUpdateSchema);
  await updateAdminProviderService({ adminId: auth.internalAdminId, request }, providerId, providerServiceId, input);
  return apiSuccess({ updated: true }, context.requestId);
});

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { providerId, providerServiceId } = params(request);
  await deleteAdminProviderService({ adminId: auth.internalAdminId, request }, providerId, providerServiceId);
  return apiSuccess({ deleted: true }, context.requestId);
});
