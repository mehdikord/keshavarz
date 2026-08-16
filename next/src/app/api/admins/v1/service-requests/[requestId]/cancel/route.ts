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
import {
  AdminCancelRequestSchema,
  RequestParamsSchema,
} from "@/server/modules/requests/request.schemas";
import { cancelAdminServiceRequest } from "@/server/modules/requests/request.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "requests.cancel", request);

  const params = parseWithSchema(RequestParamsSchema, {
    requestId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminCancelRequestSchema);
  const result = await cancelAdminServiceRequest(
    auth.internalAdminId,
    params.requestId,
    input,
  );

  await writeAdminAuditLog({
    action: "service_request_cancel",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      reason: input.reason,
      requestId: result.requestId,
    },
    module: "requests",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
