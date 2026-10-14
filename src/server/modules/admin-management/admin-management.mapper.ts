export interface AdminListRecord {
  createdAt: Date;
  email: string | null;
  image: string | null;
  isActive: number;
  isSuperAdmin: number;
  name: string;
  phone: string;
  publicId: string;
  updatedAt: Date;
}

export interface AdminRoleSummaryRecord {
  code: string;
  description: string | null;
  isActive: number;
  isSystem: number;
  name: string;
}

export interface AdminOverrideRecord {
  effect: "allow" | "deny";
  expiresAt: Date | null;
  permission: { code: string };
  reason: string | null;
}

export interface RoleListRecord {
  code: string;
  createdAt: Date;
  description: string | null;
  isActive: number;
  isSystem: number;
  name: string;
  updatedAt: Date;
}

export interface PermissionListRecord {
  action: string;
  code: string;
  description: string | null;
  module: string;
  name: string;
}

export function mapAdminSummary(admin: AdminListRecord) {
  return {
    adminId: admin.publicId,
    createdAt: admin.createdAt.toISOString(),
    email: admin.email,
    image: admin.image,
    isActive: admin.isActive === 1,
    isSuperAdmin: admin.isSuperAdmin === 1,
    name: admin.name,
    phone: admin.phone,
    updatedAt: admin.updatedAt.toISOString(),
  };
}

export function mapAdminDetail(
  admin: AdminListRecord & {
    permissionOverrides: AdminOverrideRecord[];
    roleAssignments: Array<{ role: AdminRoleSummaryRecord }>;
  },
) {
  return {
    ...mapAdminSummary(admin),
    permissionOverrides: admin.permissionOverrides.map((override) => ({
      effect: override.effect,
      expiresAt: override.expiresAt?.toISOString() ?? null,
      permissionCode: override.permission.code,
      reason: override.reason,
    })),
    roles: admin.roleAssignments.map((assignment) =>
      mapRoleSummary(assignment.role),
    ),
  };
}

export function mapRoleSummary(role: AdminRoleSummaryRecord) {
  return {
    description: role.description,
    isActive: role.isActive === 1,
    isSystem: role.isSystem === 1,
    name: role.name,
    roleId: role.code,
  };
}

export function mapRole(role: RoleListRecord) {
  return {
    ...mapRoleSummary(role),
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function mapPermission(permission: PermissionListRecord) {
  return {
    action: permission.action,
    description: permission.description,
    module: permission.module,
    name: permission.name,
    permissionCode: permission.code,
  };
}
