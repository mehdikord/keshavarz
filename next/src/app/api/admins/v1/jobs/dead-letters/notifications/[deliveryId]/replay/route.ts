import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { NotificationDeadLetterParamsSchema } from "@/server/modules/ops/ops.schemas";
import { replayNotificationDeadLetterForAdmin } from "@/server/modules/ops/ops.service";
import { assertMutationProtection } from "@/server/security";
import * as z from "zod";

export const runtime = "nodejs";

const ReplayBodySchema = z.object({}).strict();

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "notifications.send", request);
  await parseJsonBody(request, ReplayBodySchema);
  const params = parseWithSchema(NotificationDeadLetterParamsSchema, {
    deliveryId: request.nextUrl.pathname.split("/").at(-2),
  });
  const result = await replayNotificationDeadLetterForAdmin(params.deliveryId);

  await writeAdminAuditLog({
    action: "notification_dead_letter_replay",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: result,
    module: "notifications",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
