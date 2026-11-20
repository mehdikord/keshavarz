import type { NextRequest } from "next/server";

import type { AdminPermissionCode } from "@/lib/admin/permissions";
import { requireAdminActor } from "@/server/modules/admin/access/admin-access.service";
import type { TeamActor } from "@/server/modules/admin/team/team.service";

/**
 * Segment after the LAST occurrence of `marker`: team routes live under
 * `/api/admins/v1/team/admins/<id>`, where the first "admins" is the realm.
 */
export function segmentAfterLast(request: NextRequest, marker: string): string | undefined {
  const segments = request.nextUrl.pathname.split("/");
  const index = segments.lastIndexOf(marker);
  return index >= 0 ? segments[index + 1] : undefined;
}

export async function requireTeamActor(request: NextRequest, permission?: AdminPermissionCode): Promise<TeamActor> {
  const { access, auth } = await requireAdminActor(request, permission);
  return { access, adminId: auth.internalAdminId, request, sessionId: auth.sessionId };
}
