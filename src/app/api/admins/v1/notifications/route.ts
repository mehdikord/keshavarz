import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { NotificationsQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { listNotifications } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsView);
  const { items, ...meta } = await listNotifications(parseQuery(request, NotificationsQuerySchema));
  return apiSuccess(items, context.requestId, { meta });
});
