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
  AdminRemoveProviderLinkSchema,
  ProviderLinkParamsSchema,
} from "@/server/modules/requests/request.schemas";
import { removeAdminServiceRequestProvider } from "@/server/modules/requests/request.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "requests.manage", request);

  const params = parseWithSchema(ProviderLinkParamsSchema, {
    linkId: request.nextUrl.pathname.split("/").at(-2),
  });
  const input = await parseJsonBody(request, AdminRemoveProviderLinkSchema);
  const result = await removeAdminServiceRequestProvider(
    auth.internalAdminId,
    params.linkId,
    input,
  );

  await writeAdminAuditLog({
    action: "service_request_provider_remove",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      linkId: result.linkId,
      reason: input.reason ?? null,
      requestId: result.requestId,
    },
    module: "requests",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
