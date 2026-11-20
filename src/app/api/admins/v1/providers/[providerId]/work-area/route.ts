import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderParamsSchema, ProviderWorkAreaSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { updateAdminProviderWorkArea } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { providerId } = parseWithSchema(ProviderParamsSchema, { providerId: segmentAfter(request, "providers") });
  const input = await parseJsonBody(request, ProviderWorkAreaSchema);
  await updateAdminProviderWorkArea({ adminId: auth.internalAdminId, request }, providerId, input);
  return apiSuccess({ updated: true }, context.requestId);
});
