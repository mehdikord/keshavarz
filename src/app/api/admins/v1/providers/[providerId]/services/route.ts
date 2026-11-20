import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderParamsSchema, ProviderServiceCreateSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { addAdminProviderService } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { providerId } = parseWithSchema(ProviderParamsSchema, { providerId: segmentAfter(request, "providers") });
  const input = await parseJsonBody(request, ProviderServiceCreateSchema);
  const result = await addAdminProviderService({ adminId: auth.internalAdminId, request }, providerId, input);
  return apiSuccess(result, context.requestId, { status: 201 });
});
