import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { BroadcastSchema, CampaignsQuerySchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { listCampaigns, sendBroadcast } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsView);
  const { items, ...meta } = await listCampaigns(parseQuery(request, CampaignsQuerySchema).page);
  return apiSuccess(items, context.requestId, { meta });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsSend);
  const input = await parseJsonBody(request, BroadcastSchema);
  const result = await sendBroadcast({ adminId: auth.internalAdminId, request }, input);
  return apiSuccess(result, context.requestId, { status: 201 });
});
