import type { NextRequest } from "next/server";

import type { AdminAccess, AdminPermissionCode } from "@/lib/admin/permissions";
import { can } from "@/lib/admin/permissions";
import { requireAdminSession } from "@/server/auth";
import type { AdminAuthContext } from "@/server/auth";
import { systemClock } from "@/server/clock/clock";
import { getAllowedOrigins } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { loadAdminGrants } from "@/server/modules/admin/access/admin-access.repository";
import { assertMutationProtection } from "@/server/security";

/**
 * Effective permissions: role grants plus `allow` overrides, minus `deny`
 * overrides. A super admin bypasses the evaluation entirely.
 */
export async function resolveAdminAccess(adminId: bigint): Promise<AdminAccess> {
  const grants = await loadAdminGrants(adminId, systemClock.now());

  if (!grants) {
    return { isSuperAdmin: false, permissions: [] };
  }

  if (grants.isSuperAdmin) {
    return { isSuperAdmin: true, permissions: [] };
  }

  const allowed = new Set(grants.rolePermissionCodes);
  for (const override of grants.overrides) {
    if (override.effect === "allow") allowed.add(override.code);
  }
  for (const override of grants.overrides) {
    if (override.effect === "deny") allowed.delete(override.code);
  }

  return { isSuperAdmin: false, permissions: [...allowed].sort() };
}

export function assertAdminCan(
  access: AdminAccess,
  permission: AdminPermissionCode,
): void {
  if (!can(access, permission)) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "دسترسی لازم برای این عملیات را ندارید.",
    );
  }
}

export interface AdminRequestActor {
  access: AdminAccess;
  auth: AdminAuthContext;
}

/**
 * Guard for admin API routes: valid session, the given permission, and — for
 * anything other than GET/HEAD — trusted origin plus the CSRF double-submit.
 */
export async function requireAdminActor(
  request: NextRequest,
  permission?: AdminPermissionCode,
): Promise<AdminRequestActor> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    assertMutationProtection(request, "admins", getAllowedOrigins("admin"));
  }

  const auth = await requireAdminSession(request);
  const access = await resolveAdminAccess(auth.internalAdminId);

  if (permission) {
    assertAdminCan(access, permission);
  }

  return { access, auth };
}
