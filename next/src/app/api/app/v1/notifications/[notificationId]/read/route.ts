import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import {
  NotificationParamsSchema,
  ReadNotificationSchema,
} from "@/server/modules/notifications/notification.schemas";
import { markCurrentUserNotificationRead } from "@/server/modules/notifications/notification.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    new Set([getSecurityEnvironment().APP_ORIGIN]),
  );
  const auth = await requireUserSession(request);
  const params = parseWithSchema(NotificationParamsSchema, {
    notificationId: request.nextUrl.pathname.split("/").at(-2),
  });
  await parseJsonBody(request, ReadNotificationSchema);
  const result = await markCurrentUserNotificationRead(
    auth.internalUserId,
    params.notificationId,
  );
  return apiSuccess(result, context.requestId);
});
