import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { PreviewSchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { previewAudience } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

/** Recipient count and a few sample names for an audience, before sending. */
export const POST = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsSend);
  const { audience } = await parseJsonBody(request, PreviewSchema);
  return apiSuccess(await previewAudience(audience), context.requestId);
});
