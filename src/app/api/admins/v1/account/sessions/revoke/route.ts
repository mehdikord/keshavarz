import type { NextRequest } from "next/server";

import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import * as account from "@/server/modules/admin/account/account.service";
import { requireTeamActor } from "@/server/modules/admin/team/team-http";
import * as schemas from "@/server/modules/admin/team/team.schemas";

export const runtime = "nodejs";

async function self(request: NextRequest) {
  const actor = await requireTeamActor(request);
  return { adminId: actor.adminId, request, sessionId: actor.sessionId! };
}

export const POST = withApiHandler(async (request: NextRequest, context) => {
  const me = await self(request);
  return apiSuccess(await account.revokeOwnSessions(me, await parseJsonBody(request, schemas.AccountSessionRevokeSchema)), context.requestId);
});
