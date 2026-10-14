import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminNotificationsQuerySchema,
  AdminSendNotificationSchema,
} from "@/server/modules/notifications/notification.schemas";
import {
  listAdminManagedNotifications,
  sendAdminNotifications,
} from "@/server/modules/notifications/notification.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "notifications.view", request);
  const query = parseQuery(request, AdminNotificationsQuerySchema);
  const result = await listAdminManagedNotifications({
    cursor: query.cursor,
    limit: query.limit,
    recipientType: query.recipientType,
    type: query.type,
  });
  return apiSuccess({ notifications: result.items }, context.requestId, {
    meta: result.meta,
  });
});

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "notifications.send", request);
  const input = await parseJsonBody(request, AdminSendNotificationSchema);

  const result = await sendAdminNotifications({
    adminId: auth.internalAdminId,
    adminIds: input.adminIds,
    body: input.body,
    channels: input.channels,
    deepLink: input.deepLink,
    title: input.title,
    type: input.type,
    userIds: input.userIds,
  });

  await writeAdminAuditLog({
    action: "notification_send",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      batchKey: result.batchKey,
      createdCount: result.createdCount,
      type: input.type,
    },
    module: "notifications",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId, { status: 201 });
});
