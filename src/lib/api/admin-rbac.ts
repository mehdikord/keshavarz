import * as z from "zod";

import type { AdminCursorMeta, AdminListLimit } from "@/lib/admin/search-params";
import { adminApi } from "@/lib/api/admin-client";

export const RoleCodeClientSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z][a-z0-9_]{1,99}$/,
    "کد نقش باید با حرف کوچک شروع شود و فقط شامل حرف، عدد و _ باشد.",
  );

export const PermissionCodeClientSchema = z
  .string()
  .trim()
  .regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/, "کد دسترسی معتبر نیست.");

export const AdminSummarySchema = z
  .object({
    adminId: z.string(),
    createdAt: z.string(),
    email: z.string().nullable(),
    image: z.string().nullable(),
    isActive: z.boolean(),
    isSuperAdmin: z.boolean(),
    name: z.string(),
    phone: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export const AdminRoleSummarySchema = z
  .object({
    description: z.string().nullable(),
    isActive: z.boolean(),
    isSystem: z.boolean(),
    name: z.string(),
    roleId: z.string(),
  })
  .strict();

export const AdminPermissionOverrideSchema = z
  .object({
    effect: z.enum(["allow", "deny"]),
    expiresAt: z.string().nullable(),
    permissionCode: z.string(),
    reason: z.string().nullable(),
  })
  .strict();

export const AdminDetailSchema = AdminSummarySchema.extend({
  permissionOverrides: z.array(AdminPermissionOverrideSchema),
  roles: z.array(AdminRoleSummarySchema),
}).strict();

export const RoleSchema = AdminRoleSummarySchema.extend({
  createdAt: z.string(),
  updatedAt: z.string(),
}).strict();

export const PermissionSchema = z
  .object({
    action: z.string(),
    description: z.string().nullable(),
    module: z.string(),
    name: z.string(),
    permissionCode: z.string(),
  })
  .strict();

export type AdminSummary = z.infer<typeof AdminSummarySchema>;
export type AdminDetail = z.infer<typeof AdminDetailSchema>;
export type AdminRoleSummary = z.infer<typeof AdminRoleSummarySchema>;
export type AdminPermissionOverride = z.infer<
  typeof AdminPermissionOverrideSchema
>;
export type AdminRole = z.infer<typeof RoleSchema>;
export type AdminPermission = z.infer<typeof PermissionSchema>;

const CursorMetaSchema = z.object({
  hasMore: z.boolean(),
  limit: z.number(),
  nextCursor: z.string().nullable(),
});

export async function fetchAdminAdmins(input: {
  cursor?: string | null;
  isActive?: boolean;
  limit?: AdminListLimit;
  q?: string;
  signal?: AbortSignal;
}): Promise<{ items: AdminSummary[]; meta: AdminCursorMeta }> {
  const result = await adminApi.get<{ admins: unknown[] }>("/admins", {
    query: {
      cursor: input.cursor || undefined,
      isActive:
        input.isActive === undefined
          ? undefined
          : input.isActive
            ? "1"
            : "0",
      limit: input.limit,
      q: input.q || undefined,
    },
    signal: input.signal,
  });
  return {
    items: z.array(AdminSummarySchema).parse(result.data.admins),
    meta: CursorMetaSchema.parse(result.meta),
  };
}

export async function fetchAdminAdmin(
  adminId: string,
  signal?: AbortSignal,
): Promise<AdminDetail> {
  const result = await adminApi.get<unknown>(`/admins/${adminId}`, { signal });
  return AdminDetailSchema.parse(result.data);
}

export async function createAdminAdmin(input: {
  email?: string | null;
  isSuperAdmin?: boolean;
  name: string;
  password: string;
  phone: string;
}): Promise<AdminSummary> {
  const result = await adminApi.post<unknown>("/admins", input);
  return AdminSummarySchema.parse(result.data);
}

export async function patchAdminAdmin(
  adminId: string,
  input: {
    email?: string | null;
    image?: string | null;
    name?: string;
  },
): Promise<AdminDetail> {
  const result = await adminApi.patch<unknown>(`/admins/${adminId}`, input);
  return AdminDetailSchema.parse(result.data);
}

export async function updateAdminAdminStatus(
  adminId: string,
  input: { isActive: boolean },
): Promise<AdminDetail> {
  const result = await adminApi.post<unknown>(
    `/admins/${adminId}/status`,
    input,
  );
  return AdminDetailSchema.parse(result.data);
}

export async function resetAdminAdminPassword(
  adminId: string,
  input: { newPassword: string },
): Promise<{ adminId: string; passwordChanged: boolean }> {
  const result = await adminApi.post<{
    adminId: string;
    passwordChanged: boolean;
  }>(`/admins/${adminId}/reset-password`, input);
  return result.data;
}

export async function replaceAdminAdminRoles(
  adminId: string,
  input: { roleIds: string[] },
): Promise<AdminDetail> {
  const result = await adminApi.put<unknown>(
    `/admins/${adminId}/roles`,
    input,
  );
  return AdminDetailSchema.parse(result.data);
}

export async function replaceAdminPermissionOverrides(
  adminId: string,
  input: {
    overrides: Array<{
      effect: "allow" | "deny";
      expiresAt?: string | null;
      permissionCode: string;
      reason?: string | null;
    }>;
  },
): Promise<AdminDetail> {
  const result = await adminApi.put<unknown>(
    `/admins/${adminId}/permission-overrides`,
    input,
  );
  return AdminDetailSchema.parse(result.data);
}

export async function fetchAdminRoles(
  signal?: AbortSignal,
): Promise<AdminRole[]> {
  const result = await adminApi.get<{ roles: unknown[] }>("/roles", {
    signal,
  });
  return z.array(RoleSchema).parse(result.data.roles);
}

export async function createAdminRole(input: {
  code: string;
  description?: string | null;
  name: string;
}): Promise<AdminRole> {
  const result = await adminApi.post<unknown>("/roles", input);
  return RoleSchema.parse(result.data);
}

export async function patchAdminRole(
  roleId: string,
  input: {
    code?: string;
    description?: string | null;
    isActive?: boolean;
    name?: string;
  },
): Promise<AdminRole> {
  const result = await adminApi.patch<unknown>(`/roles/${roleId}`, input);
  return RoleSchema.parse(result.data);
}

export async function deleteAdminRole(roleId: string): Promise<void> {
  await adminApi.delete(`/roles/${roleId}`);
}

export async function fetchAdminRolePermissions(
  roleId: string,
  signal?: AbortSignal,
): Promise<{ permissionCodes: string[]; role: AdminRole }> {
  const result = await adminApi.get<unknown>(
    `/roles/${roleId}/permissions`,
    { signal },
  );
  return z
    .object({
      permissionCodes: z.array(z.string()),
      role: RoleSchema,
    })
    .strict()
    .parse(result.data);
}

export async function replaceAdminRolePermissions(
  roleId: string,
  input: { permissionCodes: string[] },
): Promise<{ permissionCodes: string[]; role: AdminRole }> {
  const result = await adminApi.put<unknown>(
    `/roles/${roleId}/permissions`,
    input,
  );
  return z
    .object({
      permissionCodes: z.array(z.string()),
      role: RoleSchema,
    })
    .strict()
    .parse(result.data);
}

export async function fetchAdminPermissions(
  signal?: AbortSignal,
): Promise<AdminPermission[]> {
  const result = await adminApi.get<{ permissions: unknown[] }>(
    "/permissions",
    { signal },
  );
  return z.array(PermissionSchema).parse(result.data.permissions);
}

/** Client-side effective permission preview (deny wins; super-admin ≈ all). */
export function previewEffectivePermissions(input: {
  allPermissionCodes: string[];
  isSuperAdmin: boolean;
  overrides: AdminPermissionOverride[];
  rolePermissionCodes: string[];
}): string[] {
  const now = Date.now();
  const activeOverrides = input.overrides.filter((item) => {
    if (!item.expiresAt) return true;
    return new Date(item.expiresAt).getTime() > now;
  });
  const denied = new Set(
    activeOverrides
      .filter((item) => item.effect === "deny")
      .map((item) => item.permissionCode),
  );
  const allowedExtra = activeOverrides
    .filter((item) => item.effect === "allow")
    .map((item) => item.permissionCode);

  const base = input.isSuperAdmin
    ? input.allPermissionCodes
    : input.rolePermissionCodes;

  return [...new Set([...base, ...allowedExtra])]
    .filter((code) => !denied.has(code))
    .sort();
}

export function groupPermissionsByModule(permissions: AdminPermission[]) {
  const groups = new Map<string, AdminPermission[]>();
  for (const permission of permissions) {
    const list = groups.get(permission.module) ?? [];
    list.push(permission);
    groups.set(permission.module, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, items]) => ({
      module,
      permissions: items.sort((a, b) =>
        a.permissionCode.localeCompare(b.permissionCode),
      ),
    }));
}
