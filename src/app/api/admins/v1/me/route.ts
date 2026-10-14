import type { NextRequest } from "next/server";

import { requireAdminSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { apiSuccess, parseJsonBody, withApiHandler } from "@/server/http";
import { mapAdminProfile } from "@/server/modules/admin-auth/admin-auth.mapper";
import { AdminProfileUpdateSchema } from "@/server/modules/admin-auth/admin-auth.schemas";
import {
  patchCurrentAdminProfile,
  requireCurrentAdminProfile,
} from "@/server/modules/admin-auth/admin-auth.service";
import { resolveAdminPermissionContext } from "@/server/modules/admin-rbac/require-admin-permission";
import { assertMutationProtection } from "@/server/security";

export const runtime = "nodejs";

async function mapCurrentAdmin(internalAdminId: bigint) {
  const [profile, permissionContext] = await Promise.all([
    requireCurrentAdminProfile(internalAdminId),
    resolveAdminPermissionContext(internalAdminId),
  ]);

  return mapAdminProfile(
    profile,
    [...permissionContext.allowedPermissions].sort(),
  );
}

export const GET = withApiHandler(async (request: NextRequest, context) => {
  const auth = await requireAdminSession(request);
  return apiSuccess(await mapCurrentAdmin(auth.internalAdminId), context.requestId);
});

export const PATCH = withApiHandler(async (request: NextRequest, context) => {
  assertMutationProtection(
    request,
    "admins",
    new Set([getSecurityEnvironment().ADMIN_ORIGIN]),
  );
  const auth = await requireAdminSession(request);
  const input = await parseJsonBody(request, AdminProfileUpdateSchema);
  await patchCurrentAdminProfile(auth.internalAdminId, input);
  return apiSuccess(await mapCurrentAdmin(auth.internalAdminId), context.requestId);
});
