import { prisma } from "@/server/db/prisma";

export interface AdminGrantRows {
  isSuperAdmin: boolean;
  overrides: Array<{ code: string; effect: "allow" | "deny" }>;
  rolePermissionCodes: string[];
}

/**
 * Everything that decides an admin's effective permissions: active,
 * unexpired role assignments of active roles, and unexpired per-admin
 * overrides. Disabled permission rows are ignored everywhere.
 */
export async function loadAdminGrants(
  adminId: bigint,
  now: Date,
): Promise<AdminGrantRows | null> {
  const notExpired = { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };

  const admin = await prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, isActive: 1 },
    select: {
      isSuperAdmin: true,
      permissionOverrides: {
        where: { ...notExpired, permission: { isActive: 1 } },
        select: { effect: true, permission: { select: { code: true } } },
      },
      roleAssignments: {
        where: { ...notExpired, role: { isActive: 1, deletedAt: null } },
        select: {
          role: {
            select: {
              adminRolePermissions: {
                where: { permission: { isActive: 1 } },
                select: { permission: { select: { code: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!admin) {
    return null;
  }

  return {
    isSuperAdmin: admin.isSuperAdmin === 1,
    overrides: admin.permissionOverrides.map((override) => ({
      code: override.permission.code,
      effect: override.effect,
    })),
    rolePermissionCodes: admin.roleAssignments.flatMap((assignment) =>
      assignment.role.adminRolePermissions.map((row) => row.permission.code),
    ),
  };
}
