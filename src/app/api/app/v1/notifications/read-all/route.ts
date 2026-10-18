import type { NextRequest } from "next/server";

import { requireUserSession } from "@/server/auth";
import { getAllowedOrigins } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { ReadAllNotificationsSchema } from "@/server/modules/notifications/notification.schemas";
import { markCurrentUserNotificationsReadAll } from "@/server/modules/notifications/notification.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "app",
    getAllowedOrigins("app"),
  );
  const auth = await requireUserSession(request);
  const input = await parseJsonBody(request, ReadAllNotificationsSchema);
  const result = await markCurrentUserNotificationsReadAll(
    auth.internalUserId,
    input.until,
  );
  return apiSuccess(result, context.requestId);
});
