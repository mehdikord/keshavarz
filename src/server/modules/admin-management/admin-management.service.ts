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
import {
  assertCanGrantPermissions,
  assertCanGrantSuperAdmin,
  assertCanManageAdminTarget,
  assertNotSelfAccessChange,
  type AdminActor,
} from "@/server/modules/admin-rbac/admin-escalation-guards";
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
  actor: AdminActor;
  email?: string | null;
  isSuperAdmin: boolean;
  name: string;
  password: string;
  phone: string;
}) {
  if (input.isSuperAdmin) assertCanGrantSuperAdmin(input.actor);
  assertAdminPasswordPolicy(input.password, {
    name: input.name,
    phone: input.phone,
  });

  const passwordHash = await hashPassword(input.password);
  const admin = await wrapPrisma(() =>
    createAdmin({
      createdByAdminId: input.actor.internalAdminId,
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
  actor: AdminActor,
  adminId: string,
  input: {
    email?: string | null;
    image?: string | null;
    name?: string;
  },
) {
  const admin = await requireAdminByPublicId(adminId);
  assertCanManageAdminTarget(actor, admin);
  await wrapPrisma(() => updateAdminProfile(admin.id, input));
  // Detail shape, so the console can replace its record without refetching.
  return getManagedAdmin(admin.publicId);
}

export async function setManagedAdminStatus(input: {
  actor: AdminActor;
  adminId: string;
  isActive: boolean;
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  assertCanManageAdminTarget(input.actor, admin);

  assertNotSelfDeactivation(
    input.actor.internalAdminId,
    admin.id,
    input.isActive,
  );
  await assertNotLastSuperAdminRemoval(
    admin.id,
    admin.isSuperAdmin === 1,
    input.isActive,
    false,
  );

  await updateAdminStatus(admin.id, input.isActive);

  if (!input.isActive) {
    await revokeAllAdminSessions(admin.id, systemClock.now());
    invalidateAdminPermissionCache(admin.id);
  }

  return getManagedAdmin(admin.publicId);
}

export async function resetManagedAdminPassword(input: {
  actor: AdminActor;
  adminId: string;
  newPassword: string;
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  assertCanManageAdminTarget(input.actor, admin);
  if (input.actor.internalAdminId === admin.id) {
    throw new ApiError(
      403,
      API_ERROR_CODES.forbidden,
      "برای حساب خودتان از «تغییر رمز» با رمز فعلی استفاده کنید.",
    );
  }
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
  actor: AdminActor;
  adminId: string;
  roleIds: string[];
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  assertCanManageAdminTarget(input.actor, admin);
  assertNotSelfAccessChange(input.actor, admin.id);

  const current = await getManagedAdmin(admin.publicId);
  const assignedCodes = new Set(current.roles.map((role) => role.roleId));
  const uniqueCodes = [...new Set(input.roleIds)];
  // Inactive roles can be kept if already assigned (so the form can still be
  // saved), but not newly assigned.
  const roles = await findRolesByCodes(uniqueCodes, { includeInactive: true });
  const invalid =
    roles.length !== uniqueCodes.length ||
    roles.some((role) => !role.isActive && !assignedCodes.has(role.code));

  if (invalid) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "یک یا چند نقش معتبر نیست.",
    );
  }

  const addedRoles = roles.filter((role) => !assignedCodes.has(role.code));
  const addedPermissionCodes = (
    await Promise.all(addedRoles.map((role) => listRolePermissionCodes(role.id)))
  ).flat();
  await assertCanGrantPermissions(input.actor, addedPermissionCodes);

  await replaceAdminRoleAssignments({
    adminId: admin.id,
    assignedByAdminId: input.actor.internalAdminId,
    roleIds: roles.map((role) => role.id),
  });
  invalidateAdminPermissionCache(admin.id);

  return getManagedAdmin(admin.publicId);
}

export async function replaceManagedAdminPermissionOverrides(input: {
  actor: AdminActor;
  adminId: string;
  overrides: Array<{
    effect: "allow" | "deny";
    expiresAt?: string | null;
    permissionCode: string;
    reason?: string | null;
  }>;
}) {
  const admin = await requireAdminByPublicId(input.adminId);
  assertCanManageAdminTarget(input.actor, admin);
  assertNotSelfAccessChange(input.actor, admin.id);

  const current = await getManagedAdmin(admin.publicId);
  const existingAllows = new Set(
    current.permissionOverrides
      .filter((override) => override.effect === "allow")
      .map((override) => override.permissionCode),
  );
  await assertCanGrantPermissions(
    input.actor,
    input.overrides
      .filter(
        (override) =>
          override.effect === "allow" && !existingAllows.has(override.permissionCode),
      )
      .map((override) => override.permissionCode),
  );

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
    grantedByAdminId: input.actor.internalAdminId,
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
  actor: AdminActor;
  permissionCodes: string[];
  roleId: string;
}) {
  const role = await requireRoleByCode(input.roleId);
  const uniqueCodes = [...new Set(input.permissionCodes)];
  const existingCodes = new Set(await listRolePermissionCodes(role.id));
  await assertCanGrantPermissions(
    input.actor,
    uniqueCodes.filter((code) => !existingCodes.has(code)),
  );
  const permissions = await findPermissionsByCodes(uniqueCodes);

  if (permissions.length !== uniqueCodes.length) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "یک یا چند دسترسی معتبر نیست.",
    );
  }

  await replaceRolePermissions({
    grantedByAdminId: input.actor.internalAdminId,
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
