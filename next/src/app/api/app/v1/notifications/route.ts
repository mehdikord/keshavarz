import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { apiSuccess, parseQuery, withApiHandler } from "@/server/http";
import { NotificationsQuerySchema } from "@/server/modules/notifications/notification.schemas";
import { listCurrentUserNotifications } from "@/server/modules/notifications/notification.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireUserSession(request);
  const query = parseQuery(request, NotificationsQuerySchema);
  const result = await listCurrentUserNotifications(auth.internalUserId, {
    cursor: query.cursor,
    limit: query.limit,
    readStatus: query.readStatus,
  });
  return apiSuccess({ notifications: result.items }, context.requestId, {
    meta: result.meta,
  });
});
