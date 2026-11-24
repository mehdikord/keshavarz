import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, withApiHandler } from "@/server/http";
import { readImageFormField } from "@/server/media/image-upload";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { uploadServiceContentImage } from "@/server/modules/admin/catalog/catalog-admin.service";

export const runtime = "nodejs";

/** Pictures placed inside a service's rich intro text. */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.catalogManage);
  const file = await readImageFormField(request);
  const result = await uploadServiceContentImage({ adminId: auth.internalAdminId, request }, file);
  return apiSuccess(result, context.requestId);
});
