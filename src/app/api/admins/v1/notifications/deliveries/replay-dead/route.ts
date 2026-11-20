import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { replayDeadDeliveries } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsSend);
  return apiSuccess(await replayDeadDeliveries({ adminId: auth.internalAdminId, request }), context.requestId);
});
