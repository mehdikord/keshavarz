import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { apiSuccess, withApiHandler } from "@/server/http";
import { requireAdminPermission } from "@/server/modules/admin-rbac/require-admin-permission";
import { listPaymentDeadLettersForAdmin } from "@/server/modules/ops/ops.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  await requireAdminPermission(auth, "payments.view", request);
  const data = await listPaymentDeadLettersForAdmin();
  return apiSuccess(data, context.requestId);
});
