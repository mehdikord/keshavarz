import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import {
  apiSuccess,
  parseJsonBody,
  withApiHandler,
} from "@/server/http";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { CreateExportSchema } from "@/server/modules/exports/exports.schemas";
import { createAdminExport } from "@/server/modules/exports/exports.service";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

export const POST = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  const input = await parseJsonBody(request, CreateExportSchema);

  const permission =
    input.domain === "payments" ? "payments.export" : "reports.export";
  await requireAdminPermission(auth, permission, request);

  const result = await createAdminExport({
    adminId: auth.internalAdminId,
    adminPublicId: auth.adminId,
    domain: input.domain,
    filters: input.filters,
  });

  await writeAdminAuditLog({
    action: "export_create",
    adminId: auth.internalAdminId,
    httpMethod: request.method,
    metadata: {
      domain: result.domain,
      exportId: result.exportId,
      filters: input.filters,
    },
    module: "exports",
    newValues: result,
    request,
  });

  return apiSuccess(result, context.requestId, { status: 202 });
});
