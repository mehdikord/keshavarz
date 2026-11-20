import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { DeliveriesQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { getDeliveryHealth } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsView);
  return apiSuccess(await getDeliveryHealth(parseQuery(request, DeliveriesQuerySchema)), context.requestId);
});
