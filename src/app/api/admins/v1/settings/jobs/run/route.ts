import type { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import { RunJobSchema } from "@/server/modules/admin/settings/settings-admin.schemas";
import { runJobNow } from "@/server/modules/admin/settings/settings-admin.service";

export const runtime = "nodejs";
// Jobs run inside this request; give slow ones room.
export const maxDuration = 120;

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const { auth } = await requireAdminActor(request, ADMIN_PERMISSIONS.settingsManage);
  const { job } = await parseJsonBody(request, RunJobSchema);
  return apiSuccess(await runJobNow({ adminId: auth.internalAdminId, request }, job), context.requestId);
});
