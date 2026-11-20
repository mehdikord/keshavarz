import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { apiSuccess, parseQuery, parseWithSchema, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { segmentAfter } from "@/server/modules/admin/admin-route-params";
import {
  CampaignParamsSchema,
  CampaignRecipientsQuerySchema,
} from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { getCampaign } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsView);
  const { campaignId } = parseWithSchema(CampaignParamsSchema, { campaignId: segmentAfter(request, "broadcasts") });
  const campaign = await getCampaign(campaignId, parseQuery(request, CampaignRecipientsQuerySchema));
  if (!campaign) throw new ApiError(404, API_ERROR_CODES.notFound, "این ارسال پیدا نشد.");
  return apiSuccess(campaign, context.requestId);
});
