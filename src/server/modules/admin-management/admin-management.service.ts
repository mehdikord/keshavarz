import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { revokeAllAdminSessions } from "@/server/modules/admin-auth/admin-auth.repository";
import { assertAdminPasswordPolicy } from "@/server/modules/admin-auth/admin-auth.password";
import {
  mapAdminDetail,
  mapAdminSummary,
  mapPermission,
  mapRole,
} from "@/server/modules/admin-management/admin-management.mapper";
import {
  createAdmin,
  createRole,
  findAdminByPublicId,
  findAdminDetailByPublicId,
  findPermissionsByCodes,
  findRoleByCode,
  findRolesByCodes,
  listActivePermissions,
  listAdmins,
  listRolePermissionCodes,
  listRoles,
  replaceAdminPermissionOverrides,
  replaceAdminRoleAssignments,
  replaceRolePermissions,
  resetAdminPassword,
  softDeleteRole,
  updateAdminProfile,
  updateAdminStatus,
  updateRole,
} from "@/server/modules/admin-management/admin-management.repository";
import { invalidateAdminPermissionCache } from "@/server/modules/admin-rbac/permission-cache";
import {
  assertNotLastSuperAdminRemoval,
  assertNotSelfDeactivation,
} from "@/server/modules/admin-rbac/admin-status-guards";
import { hashPassword } from "@/server/security";

function wrapPrisma<T>(operation: () => Promise<T>): Promise<T> {
  return operation().catch((error: unknown) => {
    throw (
      mapPrismaError(error) ??
      new ApiError(
        500,
        API_ERROR_CODES.internalServerError,
        "عملیات مدیریتی ناموفق بود.",
        { cause: error },
      )
    );
  });
}

async function requireAdminByPublicId(adminId: string) {
  const admin = await findAdminByPublicId(adminId);
  if (!admin) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر یافت نشد.");
  }
  return admin;
}

async function requireRoleByCode(roleId: string) {
  const role = await findRoleByCode(roleId);
  if (!role) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "نقش یافت نشد.");
  }
  return role;
}

export async function listManagedAdmins(input: {
  cursor?: string;
  isActive?: boolean;
  limit: number;
  q?: string;
}) {
  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursorAdmin = await findAdminByPublicId(input.cursor);
    if (!cursorAdmin) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "cursor معتبر نیست.",
      );
    }
    cursorId = cursorAdmin.id;
  }

  const rows = await listAdmins({
    cursorId,
    isActive: input.isActive,
    limit: input.limit,
    q: input.q,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapAdminSummary),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.publicId : null,
    },
  };
}

export async function createManagedAdmin(input: {
  actorAdminId: bigint;
  email?: string | null;
  isSuperAdmin: boolean;
  name: string;
  password: string;
  phone: string;
}) {
  assertAdminPasswordPolicy(input.password, {
    name: input.name,
    phone: input.phone,
  });

  const passwordHash = await hashPassword(input.password);
  const admin = await wrapPrisma(() =>
    createAdmin({
      createdByAdminId: input.actorAdminId,
      email: input.email,
      isSuperAdmin: input.isSuperAdmin,
      name: input.name,
      passwordHash,
      phone: input.phone,
      publicId: createPublicId(),
    }),
  );

  return mapAdminSummary(admin);
}

export async function getManagedAdmin(adminId: string) {
  const admin = await findAdminDetailByPublicId(adminId);
  if (!admin) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر یافت نشد.");
  }
  return mapAdminDetail(admin);
}

export async function updateManagedAdmin(
  adminId: string,
  input: {
    email?: string | null;
    image?: string | null;
    name?: string;
  },
) {
  const admin = await requireAdminByPublicId(adminId);
  const updated = await wrapPrisma(() =>
    updateAdminProfile(admin.id, input),
  );
  return mapAdminSummary(updated);
}

export async function setManagedAdminStatus(input: {
  actorAdminId: bigint;
  adminId: string;
  isActive: boolean;
}) {
  const admin = await requireAdminByPublicId(input.adminId);

  assertNotSelfDeactivation(
    input.actorAdminId,
    admin.id,
    input.isActive,
  );
  await assertNotLastSuperAdminRemoval(
    admin.id,
    admin.isSuperAdmin === 1,
    input.isActive,
    false,
  );

  const updated = await updateAdminStatus(admin.id, input.isActive);

  if (!input.isActive) {
    await revokeAllAdminSessions(admin.id, systemClock.now());
    invalidateAdminPermissionCache(admin.id);
  }

  return mapAdminSummary(updated);
}

export async function resetManagedAdminPassword(input: {
  adminId: string;
  newPassword: string;
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  assertAdminPasswordPolicy(input.newPassword, {
    name: admin.name,
    phone: admin.phone,
  });

  const now = systemClock.now();
  const passwordHash = await hashPassword(input.newPassword);
  const updated = await resetAdminPassword(admin.id, {
    now,
    passwordHash,
  });
  await revokeAllAdminSessions(admin.id, now);
  invalidateAdminPermissionCache(admin.id);

  return mapAdminSummary(updated);
}

export async function replaceManagedAdminRoles(input: {
  actorAdminId: bigint;
  adminId: string;
  roleIds: string[];
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  const uniqueCodes = [...new Set(input.roleIds)];
  const roles = await findRolesByCodes(uniqueCodes);

  if (roles.length !== uniqueCodes.length) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "یک یا چند نقش معتبر نیست.",
    );
  }

  await replaceAdminRoleAssignments({
    adminId: admin.id,
    assignedByAdminId: input.actorAdminId,
    roleIds: roles.map((role) => role.id),
  });
  invalidateAdminPermissionCache(admin.id);

  return getManagedAdmin(admin.publicId);
}

export async function replaceManagedAdminPermissionOverrides(input: {
  actorAdminId: bigint;
  adminId: string;
  overrides: Array<{
    effect: "allow" | "deny";
    expiresAt?: string | null;
    permissionCode: string;
    reason?: string | null;
  }>;
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  const uniqueCodes = [
    ...new Set(input.overrides.map((item) => item.permissionCode)),
  ];

  if (uniqueCodes.length !== input.overrides.length) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "کد دسترسی در overrides تکراری است.",
    );
  }

  const permissions = await findPermissionsByCodes(uniqueCodes);
  if (permissions.length !== uniqueCodes.length) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "یک یا چند دسترسی معتبر نیست.",
    );
  }

  const permissionIdByCode = new Map(
    permissions.map((permission) => [permission.code, permission.id]),
  );

  await replaceAdminPermissionOverrides({
    adminId: admin.id,
    grantedByAdminId: input.actorAdminId,
    overrides: input.overrides.map((override) => {
      const permissionId = permissionIdByCode.get(override.permissionCode);
      if (permissionId === undefined) {
        throw new ApiError(
          400,
          API_ERROR_CODES.validationFailed,
          "یک یا چند دسترسی معتبر نیست.",
        );
      }
      return {
        effect: override.effect,
        expiresAt: override.expiresAt ? new Date(override.expiresAt) : null,
        permissionId,
        reason: override.reason ?? null,
      };
    }),
  });
  invalidateAdminPermissionCache(admin.id);

  return getManagedAdmin(admin.publicId);
}

export async function listManagedRoles() {
  const roles = await listRoles();
  return roles.map(mapRole);
}

export async function createManagedRole(input: {
  actorAdminId: bigint;
  code: string;
  description?: string | null;
  name: string;
}) {
  const role = await wrapPrisma(() =>
    createRole({
      code: input.code,
      createdByAdminId: input.actorAdminId,
      description: input.description,
      name: input.name,
    }),
  );
  return mapRole(role);
}

export async function updateManagedRole(
  roleId: string,
  input: {
    code?: string;
    description?: string | null;
    isActive?: boolean;
    name?: string;
  },
) {
  const role = await requireRoleByCode(roleId);
  const isSystem = role.isSystem === 1;

  if (isSystem && input.code !== undefined && input.code !== role.code) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "تغییر کد نقش سیستمی مجاز نیست.",
    );
  }

  if (isSystem && input.isActive !== undefined) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "تغییر وضعیت فعال بودن نقش سیستمی مجاز نیست.",
    );
  }

  const updated = await wrapPrisma(() =>
    updateRole(role.id, {
      ...(isSystem
        ? {
            description: input.description,
            name: input.name,
          }
        : input),
    }),
  );

  if (input.isActive !== undefined || input.code !== undefined) {
    invalidateAdminPermissionCache();
  }

  return mapRole(updated);
}

export async function deleteManagedRole(roleId: string) {
  const role = await requireRoleByCode(roleId);

  if (role.isSystem === 1) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "حذف نقش سیستمی مجاز نیست.",
    );
  }

  await softDeleteRole(role.id, systemClock.now());
  invalidateAdminPermissionCache();

  return { deleted: true, roleId: role.code };
}

export async function replaceManagedRolePermissions(input: {
  actorAdminId: bigint;
  permissionCodes: string[];
  roleId: string;
}) {
  const role = await requireRoleByCode(input.roleId);
  const uniqueCodes = [...new Set(input.permissionCodes)];
  const permissions = await findPermissionsByCodes(uniqueCodes);

  if (permissions.length !== uniqueCodes.length) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "یک یا چند دسترسی معتبر نیست.",
    );
  }

  await replaceRolePermissions({
    grantedByAdminId: input.actorAdminId,
    permissionIds: permissions.map((permission) => permission.id),
    roleId: role.id,
  });
  invalidateAdminPermissionCache();

  const permissionCodes = await listRolePermissionCodes(role.id);
  return {
    permissionCodes,
    role: mapRole(role),
  };
}

export async function getManagedRolePermissions(roleId: string) {
  const role = await requireRoleByCode(roleId);
  const permissionCodes = await listRolePermissionCodes(role.id);
  return {
    permissionCodes,
    role: mapRole(role),
  };
}

export async function listManagedPermissions() {
  const permissions = await listActivePermissions();
  return permissions.map(mapPermission);
}
