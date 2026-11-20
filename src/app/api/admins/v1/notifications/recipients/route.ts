import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { RecipientSearchSchema } from "@/server/modules/admin/notifications/notifications-admin.schemas";
import { findRecipients } from "@/server/modules/admin/notifications/notifications-admin.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  await requireAdminActor(request, ADMIN_PERMISSIONS.notificationsSend);
  const { q } = parseQuery(request, RecipientSearchSchema);
  return apiSuccess(await findRecipients(q), context.requestId);
});
