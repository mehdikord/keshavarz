import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { ProviderGalleryParamsSchema } from "@/server/modules/admin/providers/providers-admin.schemas";
import { deleteAdminProviderGalleryImage } from "@/server/modules/admin/providers/providers-admin.service";

export const runtime = "nodejs";

export const DELETE = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.providersUpdate);
  const { imageId, providerId } = parseWithSchema(ProviderGalleryParamsSchema, {
    imageId: segmentAfter(request, "gallery"),
    providerId: segmentAfter(request, "providers"),
  });
  await deleteAdminProviderGalleryImage({ adminId: auth.internalAdminId, request }, providerId, imageId);
  return apiSuccess({ deleted: true }, context.requestId);
});
