import type { NextRequest } from "next/server";

import type { AdminAuthContext } from "@/server/auth";
import { systemClock } from "@/server/clock/clock";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import {
  getCachedAdminPermissions,
  setCachedAdminPermissions,
} from "@/server/modules/admin-rbac/permission-cache";
import {
  buildPermissionContext,
  loadAdminPermissionMaterial,
} from "@/server/modules/admin-rbac/permission-evaluator";
import {
  requirePermission,
  type PermissionContext,
} from "@/server/security";

export async function resolveAdminPermissionContext(
  adminId: bigint,
): Promise<PermissionContext> {
  const cached = getCachedAdminPermissions(adminId);
  if (cached) {
    return cached;
  }

  const material = await loadAdminPermissionMaterial(
    adminId,
    systemClock.now(),
  );
  const context = buildPermissionContext(material);
  setCachedAdminPermissions(adminId, context);
  return context;
}

export async function requireAdminPermission(
  auth: AdminAuthContext,
  permission: string,
  request: NextRequest,
): Promise<PermissionContext> {
  const context = await resolveAdminPermissionContext(auth.internalAdminId);

  try {
    requirePermission(context, permission);
  } catch (error) {
    await writeAdminAuditLog({
      action: "permission_denied",
      adminId: auth.internalAdminId,
      httpMethod: request.method,
      metadata: {
        isSuperAdmin: auth.isSuperAdmin,
        permission,
        result: "denied",
      },
      module: permission.split(".")[0] ?? "security",
      request,
      route: request.nextUrl.pathname,
    });
    throw error;
  }

  if (context.isSuperAdmin && !context.allowedPermissions.has(permission)) {
    await writeAdminAuditLog({
      action: "super_admin_bypass",
      adminId: auth.internalAdminId,
      httpMethod: request.method,
      metadata: {
        permission,
        result: "allowed",
      },
      module: permission.split(".")[0] ?? "security",
      request,
      route: request.nextUrl.pathname,
    });
  }

  return context;
}
