import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderParamsSchema, ProviderStatusSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { setAdminProviderStatus } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersChangeStatus);
  const { providerId } = parseWithSchema(ProviderParamsSchema, { providerId: segmentAfter(request, "providers") });
  const input = await parseJsonBody(request, ProviderStatusSchema);
  await setAdminProviderStatus({ adminId: auth.internalAdminId, request }, providerId, input);
  return apiSuccess({ updated: true }, context.requestId);
});
