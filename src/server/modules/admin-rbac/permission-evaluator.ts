import { prisma } from "@/server/db/prisma";
import type { PermissionContext } from "@/server/security";

export async function loadAdminPermissionMaterial(
  adminId: bigint,
  now: Date,
): Promise<{
  isSuperAdmin: boolean;
  rolePermissionCodes: string[];
  overrides: Array<{ code: string; effect: "allow" | "deny" }>;
}> {
  const admin = await prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, isActive: 1 },
    select: {
      isSuperAdmin: true,
      permissionOverrides: {
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          permission: { isActive: 1 },
        },
        select: {
          effect: true,
          permission: { select: { code: true } },
        },
      },
      roleAssignments: {
        where: {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          role: { isActive: 1, deletedAt: null },
        },
        select: {
          role: {
            select: {
              adminRolePermissions: {
                where: { permission: { isActive: 1 } },
                select: {
                  permission: { select: { code: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!admin) {
    return {
      isSuperAdmin: false,
      overrides: [],
      rolePermissionCodes: [],
    };
  }

  const rolePermissionCodes = admin.roleAssignments.flatMap((assignment) =>
    assignment.role.adminRolePermissions.map(
      (item) => item.permission.code,
    ),
  );

  return {
    isSuperAdmin: admin.isSuperAdmin === 1,
    overrides: admin.permissionOverrides.map((override) => ({
      code: override.permission.code,
      effect: override.effect,
    })),
    rolePermissionCodes,
  };
}

export function buildPermissionContext(input: {
  isSuperAdmin: boolean;
  overrides: Array<{ code: string; effect: "allow" | "deny" }>;
  rolePermissionCodes: string[];
}): PermissionContext {
  const allowedPermissions = new Set(input.rolePermissionCodes);
  const deniedPermissions = new Set<string>();

  for (const override of input.overrides) {
    if (override.effect === "deny") {
      deniedPermissions.add(override.code);
      allowedPermissions.delete(override.code);
    } else {
      allowedPermissions.add(override.code);
    }
  }

  return {
    allowedPermissions,
    deniedPermissions,
    isSuperAdmin: input.isSuperAdmin,
  };
}
