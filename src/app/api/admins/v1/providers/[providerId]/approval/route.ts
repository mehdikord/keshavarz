import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderApprovalSchema, ProviderParamsSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { setAdminProviderApproval } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersChangeStatus);
  const { providerId } = parseWithSchema(ProviderParamsSchema, { providerId: segmentAfter(request, "providers") });
  const { approved } = await parseJsonBody(request, ProviderApprovalSchema);
  await setAdminProviderApproval({ adminId: auth.internalAdminId, request }, providerId, approved);
  return apiSuccess({ updated: true }, context.requestId);
});
