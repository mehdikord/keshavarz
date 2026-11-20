import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import { DeliveryParamsSchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { replayDelivery } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsSend);
  const { deliveryId } = parseWithSchema(DeliveryParamsSchema, { deliveryId: segmentAfter(request, "deliveries") });
  await replayDelivery({ adminId: auth.internalAdminId, request }, deliveryId);
  return apiSuccess({ requeued: true }, context.requestId);
});
