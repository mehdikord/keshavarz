import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { OpsJobsRunSchema } from "@/server/modules/ops/ops.schemas";
import { runOpsJobsForAdmin } from "@/server/modules/ops/ops.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "settings.manage", request);
  const input = await parseJsonBody(request, OpsJobsRunSchema);
  const result = await runOpsJobsForAdmin(input.jobs);

  await writeAdminAuditLog({
    action: "jobs_run",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: { jobs: input.jobs },
    module: "jobs",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId);
});
