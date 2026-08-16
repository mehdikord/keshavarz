import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  parseQuery,
  parseWithSchema,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import {
  AdminUserModerationActionSchema,
  AdminUserModerationActionsQuerySchema,
  AdminUserParamsSchema,
} from "@/server/modules/admin-users/admin-users.schemas";
import {
  createUserModerationActionForAdmin,
  listUserModerationActionsForAdmin,
} from "@/server/modules/admin-users/admin-users.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

function userIdFromPath(request: NextRequest): string | undefined {
  return request.nextUrl.pathname.split("/").at(-2);
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "users.view", request);
  const params = parseWithSchema(AdminUserParamsSchema, {
    userId: userIdFromPath(request),
  });
  const query = parseQuery(request, AdminUserModerationActionsQuerySchema);
  const result = await listUserModerationActionsForAdmin({
    cursor: query.cursor,
    limit: query.limit,
    userId: params.userId,
  });
  return apiSuccess({ moderationActions: result.items }, context.requestId, {
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
  await requireAdminPermission(auth, "users.change_status", request);
  const params = parseWithSchema(AdminUserParamsSchema, {
    userId: userIdFromPath(request),
  });
  const input = await parseJsonBody(request, AdminUserModerationActionSchema);
  const result = await createUserModerationActionForAdmin({
    action: input.action,
    adminId: auth.internalAdminId,
    endsAt: input.endsAt,
    reason: input.reason,
    userId: params.userId,
  });

  await writeAdminAuditLog({
    action: "user_moderation",
    adminId: auth.internalAdminId,
    auditableId: result.userId,
    auditableType: "User",
    httpMethod: request.method,
    metadata: {
      moderationAction: input.action,
      reason: input.reason,
    },
    module: "users",
    newValues: result.moderation,
    request,
  });

  return apiSuccess(result.moderation, context.requestId, { status: 201 });
});
