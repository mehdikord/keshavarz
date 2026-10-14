import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";
import { runInTransaction } from "@/server/db/transaction";

const adminSummarySelect = {
  createdAt: true,
  email: true,
  image: true,
  isActive: true,
  isSuperAdmin: true,
  name: true,
  phone: true,
  publicId: true,
  updatedAt: true,
} as const;

const adminDetailSelect = {
  ...adminSummarySelect,
  id: true,
  permissionOverrides: {
    orderBy: { id: "asc" as const },
    select: {
      effect: true,
      expiresAt: true,
      permission: { select: { code: true } },
      reason: true,
    },
  },
  roleAssignments: {
    orderBy: { id: "asc" as const },
    select: {
      role: {
        select: {
          code: true,
          description: true,
          isActive: true,
          isSystem: true,
          name: true,
        },
      },
    },
    where: {
      role: { deletedAt: null },
    },
  },
} as const;

const roleSelect = {
  code: true,
  createdAt: true,
  description: true,
  id: true,
  isActive: true,
  isSystem: true,
  name: true,
  updatedAt: true,
} as const;

export async function findAdminByPublicId(publicId: string) {
  return prisma.admin.findFirst({
    where: { deletedAt: null, publicId },
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function findAdminDetailByPublicId(publicId: string) {
  return prisma.admin.findFirst({
    where: { deletedAt: null, publicId },
    select: adminDetailSelect,
  });
}

export async function listAdmins(input: {
  cursorId?: bigint;
  isActive?: boolean;
  limit: number;
  q?: string;
}) {
  const where: Prisma.AdminWhereInput = {
    deletedAt: null,
    ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    ...(input.isActive === undefined
      ? {}
      : { isActive: input.isActive ? 1 : 0 }),
    ...(input.q
      ? {
          OR: [
            { name: { contains: input.q } },
            { phone: { contains: input.q } },
            { email: { contains: input.q } },
          ],
        }
      : {}),
  };

  return prisma.admin.findMany({
    where,
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function createAdmin(input: {
  createdByAdminId: bigint;
  email?: string | null;
  isSuperAdmin: boolean;
  name: string;
  passwordHash: string;
  phone: string;
  publicId: string;
}) {
  return prisma.admin.create({
    data: {
      createdByAdminId: input.createdByAdminId,
      email: input.email ?? null,
      isSuperAdmin: input.isSuperAdmin ? 1 : 0,
      name: input.name,
      password: input.passwordHash,
      phone: input.phone,
      publicId: input.publicId,
    },
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function updateAdminProfile(
  adminId: bigint,
  data: {
    email?: string | null;
    image?: string | null;
    name?: string;
  },
) {
  return prisma.admin.update({
    where: { id: adminId },
    data,
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function updateAdminStatus(
  adminId: bigint,
  isActive: boolean,
) {
  return prisma.admin.update({
    where: { id: adminId },
    data: { isActive: isActive ? 1 : 0 },
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function resetAdminPassword(
  adminId: bigint,
  input: { now: Date; passwordHash: string },
) {
  return prisma.admin.update({
    where: { id: adminId },
    data: {
      password: input.passwordHash,
      passwordChangedAt: input.now,
    },
    select: {
      ...adminSummarySelect,
      id: true,
    },
  });
}

export async function findRolesByCodes(codes: string[]) {
  if (codes.length === 0) {
    return [];
  }

  return prisma.adminRole.findMany({
    where: {
      code: { in: codes },
      deletedAt: null,
      isActive: 1,
    },
    select: { code: true, id: true },
  });
}

export async function replaceAdminRoleAssignments(input: {
  adminId: bigint;
  assignedByAdminId: bigint;
  roleIds: bigint[];
}) {
  await runInTransaction(async (transaction) => {
    await transaction.adminRoleAssignment.deleteMany({
      where: { adminId: input.adminId },
    });

    if (input.roleIds.length === 0) {
      return;
    }

    await transaction.adminRoleAssignment.createMany({
      data: input.roleIds.map((roleId) => ({
        adminId: input.adminId,
        assignedByAdminId: input.assignedByAdminId,
        roleId,
      })),
    });
  });
}

export async function findPermissionsByCodes(codes: string[]) {
  if (codes.length === 0) {
    return [];
  }

  return prisma.adminPermission.findMany({
    where: {
      code: { in: codes },
      isActive: 1,
    },
    select: { code: true, id: true },
  });
}

export async function replaceAdminPermissionOverrides(input: {
  adminId: bigint;
  grantedByAdminId: bigint;
  overrides: Array<{
    effect: "allow" | "deny";
    expiresAt: Date | null;
    permissionId: bigint;
    reason: string | null;
  }>;
}) {
  await runInTransaction(async (transaction) => {
    await transaction.adminPermissionOverride.deleteMany({
      where: { adminId: input.adminId },
    });

    if (input.overrides.length === 0) {
      return;
    }

    await transaction.adminPermissionOverride.createMany({
      data: input.overrides.map((override) => ({
        adminId: input.adminId,
        effect: override.effect,
        expiresAt: override.expiresAt,
        grantedByAdminId: input.grantedByAdminId,
        permissionId: override.permissionId,
        reason: override.reason,
      })),
    });
  });
}

export async function listRoles() {
  return prisma.adminRole.findMany({
    where: { deletedAt: null },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    select: roleSelect,
  });
}

export async function findRoleByCode(code: string) {
  return prisma.adminRole.findFirst({
    where: { code, deletedAt: null },
    select: roleSelect,
  });
}

export async function createRole(input: {
  code: string;
  createdByAdminId: bigint;
  description?: string | null;
  name: string;
}) {
  return prisma.adminRole.create({
    data: {
      code: input.code,
      createdByAdminId: input.createdByAdminId,
      description: input.description ?? null,
      isSystem: 0,
      name: input.name,
    },
    select: roleSelect,
  });
}

export async function updateRole(
  roleId: bigint,
  data: {
    code?: string;
    description?: string | null;
    isActive?: boolean;
    name?: string;
  },
) {
  return prisma.adminRole.update({
    where: { id: roleId },
    data: {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.isActive !== undefined
        ? { isActive: data.isActive ? 1 : 0 }
        : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
    },
    select: roleSelect,
  });
}

export async function softDeleteRole(roleId: bigint, now: Date) {
  return prisma.adminRole.update({
    where: { id: roleId },
    data: {
      deletedAt: now,
      isActive: 0,
    },
    select: roleSelect,
  });
}

export async function replaceRolePermissions(input: {
  grantedByAdminId: bigint;
  permissionIds: bigint[];
  roleId: bigint;
}) {
  await runInTransaction(async (transaction) => {
    await transaction.adminRolePermission.deleteMany({
      where: { roleId: input.roleId },
    });

    if (input.permissionIds.length === 0) {
      return;
    }

    await transaction.adminRolePermission.createMany({
      data: input.permissionIds.map((permissionId) => ({
        grantedByAdminId: input.grantedByAdminId,
        permissionId,
        roleId: input.roleId,
      })),
    });
  });
}

export async function listRolePermissionCodes(roleId: bigint) {
  const rows = await prisma.adminRolePermission.findMany({
    where: {
      roleId,
      permission: { isActive: 1 },
    },
    orderBy: { id: "asc" },
    select: {
      permission: { select: { code: true } },
    },
  });

  return rows.map((row) => row.permission.code);
}

export async function listActivePermissions() {
  return prisma.adminPermission.findMany({
    where: { isActive: 1 },
    orderBy: [{ module: "asc" }, { action: "asc" }],
    select: {
      action: true,
      code: true,
      description: true,
      module: true,
      name: true,
    },
  });
}
