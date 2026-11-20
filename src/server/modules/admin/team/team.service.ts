import { randomInt } from "node:crypto";
import type { NextRequest } from "next/server";

import type { AdminAccess } from "@/lib/admin/permissions";
import { systemClock } from "@/server/clock/clock";
import { prisma } from "@/server/db/prisma";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { resolveAdminAccess } from "@/server/modules/admin/access/admin-access.service";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countActiveSuperAdmins,
  countAdminsPerStatus,
  countRoleAssignments,
  deleteOverride,
  deleteRoleAssignments,
  findAdminByPublicId,
  findAdminIdByEmail,
  findAdminIdByPhone,
  findOverride,
  findRoleById,
  findRoleIdByCode,
  findRolesByIds,
  insertAdmin,
  insertRole,
  listAdminAssignments,
  listAdminOverrides,
  listAdminRows,
  listAdminSessions,
  listAuditForSubjectOrActor,
  listPermissions,
  listRoleMembers,
  listRoleOptions,
  listRoleRows,
  lockAdminRows,
  replaceRoleAssignments,
  replaceRolePermissions,
  revokeAdminSessions,
  updateAdminRow,
  updateRoleRow,
  upsertOverride,
} from "@/server/modules/admin/team/team.repository";
import type {
  AdminCreateInput,
  AdminOverrideInput,
  AdminRolesInput,
  AdminUpdateInput,
  AdminsListQuery,
  RoleCreateInput,
  RoleUpdateInput,
  RolesListQuery,
} from "@/server/modules/admin/team/team.schemas";
import { hashPassword } from "@/server/security";

import { type AuditEntry, mapAuditRows } from "./audit-viewer.service";

/** Who is acting: the admin, what they may do, and the request for the audit row. */
export interface TeamActor {
  access: AdminAccess;
  adminId: bigint;
  request?: NextRequest;
  /** The actor's own session, kept alive when they change their own login phone. */
  sessionId?: bigint;
}

const MODULE = "team";
const ADMIN_SUBJECT = "admin";
const ROLE_SUBJECT = "admin_role";
const SYSTEM_ROLE_CODE = "platform_admin";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

function forbidden(message: string): never {
  throw new ApiError(403, API_ERROR_CODES.forbidden, message);
}

function conflict(message: string, field?: string): never {
  throw new ApiError(409, API_ERROR_CODES.conflict, message, field ? { fields: { [field]: [message] } } : undefined);
}

function rethrow(error: unknown): never {
  if (error instanceof ApiError) throw error;
  throw mapPrismaError(error) ?? error;
}

function holds(access: AdminAccess, code: string): boolean {
  return access.isSuperAdmin || access.permissions.includes(code);
}

/** A non-super admin may only hand out what they hold themselves. */
function assertGrantable(actor: TeamActor, codes: Iterable<string>) {
  const missing = [...codes].filter((code) => !holds(actor.access, code));
  if (missing.length) {
    forbidden(`نمی‌توانید دسترسی‌ای را بدهید که خودتان ندارید (${missing.join("، ")}).`);
  }
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Readable random password (no 0/O, 1/l/I) that satisfies the policy. */
export function generateAdminPassword(length = 16): string {
  for (;;) {
    let value = "";
    for (let index = 0; index < length; index += 1) value += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
    if (/[A-Za-z]/.test(value) && /\d/.test(value)) return value;
  }
}

type TargetAdmin = NonNullable<Awaited<ReturnType<typeof findAdminByPublicId>>>;

async function requireTarget(db: TransactionClient, publicId: string): Promise<TargetAdmin> {
  const admin = await findAdminByPublicId(db, publicId);
  if (!admin) throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر پیدا نشد.");
  return admin;
}

function assertNotSelf(actor: TeamActor, target: TargetAdmin, message: string) {
  if (actor.adminId === target.id) forbidden(message);
}

function assertMayTouch(actor: TeamActor, target: TargetAdmin) {
  if (target.isSuperAdmin === 1 && !actor.access.isSuperAdmin) {
    forbidden("فقط مدیر ارشد می‌تواند حساب یک مدیر ارشد را تغییر دهد.");
  }
}

async function assertNotLastSuperAdmin(transaction: TransactionClient, target: TargetAdmin, message: string) {
  if (target.isSuperAdmin !== 1 || target.isActive !== 1) return;
  if ((await countActiveSuperAdmins(transaction, target.id)) === 0) conflict(message);
}

// ===================================================================== admins

export interface TeamAdminListItem {
  activeSessions: number;
  createdAt: string;
  email: string | null;
  id: string;
  image: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  name: string;
  overrides: number;
  phone: string;
  roles: Array<{ expiresAt: string | null; id: string; isActive: boolean; name: string }>;
}

export interface RoleOption {
  code: string;
  id: string;
  isActive: boolean;
  isSystem: boolean;
  name: string;
  permissions: string[];
}

export async function getRoleOptions(): Promise<RoleOption[]> {
  const rows = await listRoleOptions();
  return rows.map((row) => ({
    code: row.code,
    id: row.id.toString(),
    isActive: row.isActive === 1,
    isSystem: row.isSystem === 1,
    name: row.name,
    permissions: row.adminRolePermissions.map((entry) => entry.permission.code),
  }));
}

export async function listTeamAdmins(query: AdminsListQuery) {
  const now = systemClock.now();
  const [{ rows, total }, counts, roles] = await Promise.all([
    listAdminRows(query, now),
    countAdminsPerStatus(query, now),
    getRoleOptions(),
  ]);
  return {
    counts,
    items: rows.map<TeamAdminListItem>((row) => ({
      activeSessions: row._count.adminSessions,
      createdAt: row.createdAt.toISOString(),
      email: row.email,
      id: row.publicId,
      image: row.image,
      isActive: row.isActive === 1,
      isSuperAdmin: row.isSuperAdmin === 1,
      lastLoginAt: iso(row.lastLoginAt),
      lockedUntil: row.lockedUntil && row.lockedUntil > now ? row.lockedUntil.toISOString() : null,
      name: row.name,
      overrides: row._count.permissionOverrides,
      phone: row.phone,
      roles: row.roleAssignments
        .filter((assignment) => !assignment.expiresAt || assignment.expiresAt > now)
        .map((assignment) => ({
          expiresAt: iso(assignment.expiresAt),
          id: assignment.role.id.toString(),
          isActive: assignment.role.isActive === 1,
          name: assignment.role.name,
        })),
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    roles,
    total,
  };
}

export async function getTeamAdminDetail(publicId: string) {
  const now = systemClock.now();
  const admin = await findAdminByPublicId(prisma, publicId);
  if (!admin) return null;

  const [assignments, overrides, sessions, access, activity, about, permissions] = await Promise.all([
    listAdminAssignments(prisma, admin.id),
    listAdminOverrides(prisma, admin.id),
    listAdminSessions(admin.id, now),
    resolveAdminAccess(admin.id),
    listAuditForSubjectOrActor({ actorId: admin.id }, 15),
    listAuditForSubjectOrActor({ subject: { id: admin.id, type: ADMIN_SUBJECT } }, 15),
    listPermissions(),
  ]);

  const [activityEntries, aboutEntries] = await Promise.all([mapAuditRows(activity), mapAuditRows(about)]);

  return {
    access,
    activity: activityEntries,
    admin: {
      createdAt: admin.createdAt.toISOString(),
      createdBy: admin.createdByAdmin ? { id: admin.createdByAdmin.publicId, name: admin.createdByAdmin.name } : null,
      email: admin.email,
      failedLoginAttempts: admin.failedLoginAttempts,
      id: admin.publicId,
      image: admin.image,
      isActive: admin.isActive === 1,
      isSuperAdmin: admin.isSuperAdmin === 1,
      lastLoginAt: iso(admin.lastLoginAt),
      lastLoginIp: admin.lastLoginIp,
      lockedUntil: admin.lockedUntil && admin.lockedUntil > now ? admin.lockedUntil.toISOString() : null,
      name: admin.name,
      passwordChangedAt: iso(admin.passwordChangedAt),
      phone: admin.phone,
    },
    assignments: assignments.map((row) => ({
      assignedAt: row.createdAt.toISOString(),
      assignedBy: row.assignedByAdmin?.name ?? null,
      expired: Boolean(row.expiresAt && row.expiresAt <= now),
      expiresAt: iso(row.expiresAt),
      role: {
        code: row.role.code,
        id: row.role.id.toString(),
        isActive: row.role.isActive === 1,
        isSystem: row.role.isSystem === 1,
        name: row.role.name,
        permissions: row.role.adminRolePermissions.map((entry) => entry.permission.code),
      },
    })),
    changes: aboutEntries,
    overrides: overrides.map((row) => ({
      code: row.permission.code,
      createdAt: row.createdAt.toISOString(),
      effect: row.effect,
      expired: Boolean(row.expiresAt && row.expiresAt <= now),
      expiresAt: iso(row.expiresAt),
      grantedBy: row.grantedByAdmin?.name ?? null,
      id: row.id.toString(),
      reason: row.reason,
    })),
    permissionCodes: permissions.filter((row) => row.isActive === 1).map((row) => row.code),
    sessions: sessions.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      id: row.publicId,
      ipAddress: row.ipAddress,
      isActive: !row.revokedAt && row.expiresAt > now,
      lastActivityAt: row.lastActivityAt.toISOString(),
      revokedAt: iso(row.revokedAt),
      userAgent: row.userAgent,
    })),
  };
}
export type TeamAdminDetail = NonNullable<Awaited<ReturnType<typeof getTeamAdminDetail>>>;

async function assertPhoneEmailFree(
  transaction: TransactionClient,
  input: { email: string | null; phone: string },
  selfId?: bigint,
) {
  const byPhone = await findAdminIdByPhone(transaction, input.phone);
  if (byPhone && byPhone.id !== selfId) {
    conflict(
      byPhone.deletedAt ? "این شماره متعلق به یک حساب مدیر حذف‌شده است." : "این شماره موبایل برای مدیر دیگری ثبت شده است.",
      "phone",
    );
  }
  if (input.email) {
    const byEmail = await findAdminIdByEmail(transaction, input.email);
    if (byEmail && byEmail.id !== selfId) conflict("این ایمیل برای مدیر دیگری ثبت شده است.", "email");
  }
}

async function loadRolesForGrant(transaction: TransactionClient, ids: string[]) {
  const roles = await findRolesByIds(transaction, ids.map((id) => BigInt(id)));
  if (roles.length !== ids.length) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "یکی از نقش‌های انتخاب‌شده وجود ندارد.", {
      fields: { roleIds: ["یکی از نقش‌های انتخاب‌شده وجود ندارد."] },
    });
  }
  return roles;
}

export async function createTeamAdmin(
  actor: TeamActor,
  input: AdminCreateInput,
): Promise<{ id: string; password: string | null }> {
  if (input.isSuperAdmin && !actor.access.isSuperAdmin) forbidden("فقط مدیر ارشد می‌تواند مدیر ارشد بسازد.");
  const generated = input.password ? null : generateAdminPassword();
  const password = await hashPassword(input.password || generated!);

  try {
    const created = await runInTransaction(async (transaction) => {
      await assertPhoneEmailFree(transaction, { email: input.email, phone: input.phone });
      const roles = await loadRolesForGrant(transaction, input.roleIds);
      assertGrantable(actor, roles.flatMap((role) => role.adminRolePermissions.map((entry) => entry.permission.code)));

      const now = systemClock.now();
      const admin = await insertAdmin(transaction, {
        createdByAdminId: actor.adminId,
        email: input.email,
        isActive: 1,
        isSuperAdmin: input.isSuperAdmin ? 1 : 0,
        name: input.name,
        password,
        passwordChangedAt: now,
        phone: input.phone,
        publicId: createPublicId(now.getTime()),
      });
      if (roles.length) {
        await replaceRoleAssignments(transaction, {
          adminId: admin.id,
          assignedBy: actor.adminId,
          roles: roles.map((role) => ({ expiresAt: null, roleId: role.id })),
        });
      }
      await recordAdminAudit(
        {
          action: "team.admins.create",
          adminId: actor.adminId,
          module: MODULE,
          newValues: {
            email: input.email,
            isSuperAdmin: input.isSuperAdmin,
            name: input.name,
            phone: input.phone,
            roles: roles.map((role) => role.name),
          },
          request: actor.request,
          subject: { id: admin.id, type: ADMIN_SUBJECT },
        },
        transaction,
      );
      return admin;
    });
    return { id: created.publicId, password: generated };
  } catch (error) {
    rethrow(error);
  }
}

export async function updateTeamAdmin(actor: TeamActor, publicId: string, input: AdminUpdateInput): Promise<void> {
  try {
    await runInTransaction(async (transaction) => {
      const target = await requireTarget(transaction, publicId);
      assertMayTouch(actor, target);
      await lockAdminRows(transaction, [target.id]);

      const superChange = input.isSuperAdmin !== undefined && input.isSuperAdmin !== (target.isSuperAdmin === 1);
      if (superChange) {
        if (!actor.access.isSuperAdmin) forbidden("فقط مدیر ارشد می‌تواند نقش مدیر ارشد را بدهد یا بگیرد.");
        assertNotSelf(actor, target, "نمی‌توانید سطح مدیر ارشد را از حساب خودتان بردارید.");
        if (!input.isSuperAdmin) {
          await assertNotLastSuperAdmin(transaction, target, "این تنها مدیر ارشد فعال است؛ ابتدا مدیر ارشد دیگری تعیین کنید.");
        }
      }
      await assertPhoneEmailFree(transaction, { email: input.email, phone: input.phone }, target.id);

      const phoneChanged = input.phone !== target.phone;
      await updateAdminRow(transaction, target.id, {
        email: input.email,
        name: input.name,
        phone: input.phone,
        ...(superChange ? { isSuperAdmin: input.isSuperAdmin ? 1 : 0 } : {}),
      });
      // A new phone is a new login identity: end every session on the old one.
      if (phoneChanged || (superChange && !input.isSuperAdmin)) {
        await revokeAdminSessions(transaction, {
          adminId: target.id,
          exceptSessionId: actor.adminId === target.id ? actor.sessionId : undefined,
          now: systemClock.now(),
        });
      }
      await recordAdminAudit(
        {
          action: superChange ? (input.isSuperAdmin ? "team.admins.super_grant" : "team.admins.super_revoke") : "team.admins.update",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { email: input.email, isSuperAdmin: input.isSuperAdmin, name: input.name, phone: input.phone },
          oldValues: { email: target.email, isSuperAdmin: target.isSuperAdmin === 1, name: target.name, phone: target.phone },
          request: actor.request,
          subject: { id: target.id, type: ADMIN_SUBJECT },
        },
        transaction,
      );
    });
  } catch (error) {
    rethrow(error);
  }
}

export async function setTeamAdminStatus(
  actor: TeamActor,
  publicId: string,
  input: { isActive: boolean; reason: string },
): Promise<void> {
  await runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "نمی‌توانید حساب خودتان را غیرفعال کنید.");
    await lockAdminRows(transaction, [target.id]);
    if ((target.isActive === 1) === input.isActive) return;

    const now = systemClock.now();
    if (!input.isActive) {
      await assertNotLastSuperAdmin(transaction, target, "این تنها مدیر ارشد فعال است و غیرفعال کردن آن ممکن نیست.");
      await revokeAdminSessions(transaction, { adminId: target.id, now });
    }
    await updateAdminRow(transaction, target.id, {
      isActive: input.isActive ? 1 : 0,
      ...(input.isActive ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
    });
    await recordAdminAudit(
      {
        action: input.isActive ? "team.admins.activate" : "team.admins.deactivate",
        adminId: actor.adminId,
        metadata: { reason: input.reason },
        module: MODULE,
        newValues: { isActive: input.isActive },
        oldValues: { isActive: target.isActive === 1 },
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
  });
}

export async function resetTeamAdminPassword(
  actor: TeamActor,
  publicId: string,
  input: { password?: string },
): Promise<{ password: string | null }> {
  const generated = input.password ? null : generateAdminPassword();
  const hash = await hashPassword(input.password || generated!);
  await runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "رمز عبور خودتان را از صفحه «حساب من» تغییر دهید.");
    const now = systemClock.now();
    await updateAdminRow(transaction, target.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      password: hash,
      passwordChangedAt: now,
    });
    const revoked = await revokeAdminSessions(transaction, { adminId: target.id, now });
    await recordAdminAudit(
      {
        action: "team.admins.password_reset",
        adminId: actor.adminId,
        metadata: { generated: Boolean(generated), sessionsRevoked: revoked },
        module: MODULE,
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
  });
  return { password: generated };
}

export async function unlockTeamAdmin(actor: TeamActor, publicId: string): Promise<void> {
  await runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    await updateAdminRow(transaction, target.id, { failedLoginAttempts: 0, lockedUntil: null });
    await recordAdminAudit(
      {
        action: "team.admins.unlock",
        adminId: actor.adminId,
        module: MODULE,
        oldValues: { failedLoginAttempts: target.failedLoginAttempts, lockedUntil: target.lockedUntil },
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
  });
}

export async function revokeTeamAdminSessions(actor: TeamActor, publicId: string, sessionPublicId?: string) {
  return runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "نشست‌های خودتان را از صفحه «حساب من» مدیریت کنید.");
    const revoked = await revokeAdminSessions(transaction, { adminId: target.id, now: systemClock.now(), sessionPublicId });
    await recordAdminAudit(
      {
        action: "team.admins.sessions_revoke",
        adminId: actor.adminId,
        metadata: { revoked, sessionId: sessionPublicId ?? "all" },
        module: MODULE,
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
    return { revoked };
  });
}

export async function setTeamAdminRoles(actor: TeamActor, publicId: string, input: AdminRolesInput): Promise<void> {
  await runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "نمی‌توانید نقش‌های حساب خودتان را تغییر دهید؛ از مدیر دیگری بخواهید.");

    const current = await listAdminAssignments(transaction, target.id);
    const currentIds = new Set(current.map((row) => row.roleId.toString()));
    const roles = await loadRolesForGrant(transaction, input.roles.map((row) => row.roleId));
    const added = roles.filter((role) => !currentIds.has(role.id.toString()));
    assertGrantable(actor, added.flatMap((role) => role.adminRolePermissions.map((entry) => entry.permission.code)));

    await replaceRoleAssignments(transaction, {
      adminId: target.id,
      assignedBy: actor.adminId,
      roles: input.roles.map((row) => ({ expiresAt: row.expiresAt ?? null, roleId: BigInt(row.roleId) })),
    });
    await recordAdminAudit(
      {
        action: "team.admins.roles",
        adminId: actor.adminId,
        module: MODULE,
        newValues: {
          roles: input.roles.map((row) => ({
            expiresAt: row.expiresAt,
            role: roles.find((role) => role.id.toString() === row.roleId)?.name ?? row.roleId,
          })),
        },
        oldValues: { roles: current.map((row) => ({ expiresAt: row.expiresAt, role: row.role.name })) },
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
  });
}

export async function upsertTeamAdminOverride(actor: TeamActor, publicId: string, input: AdminOverrideInput) {
  return runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "نمی‌توانید دسترسی‌های حساب خودتان را تغییر دهید.");
    const permission = (await listPermissions(transaction)).find((row) => row.code === input.permission && row.isActive === 1);
    if (!permission) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "این دسترسی وجود ندارد.", {
        fields: { permission: ["این دسترسی وجود ندارد."] },
      });
    }
    if (input.effect === "allow") assertGrantable(actor, [permission.code]);
    const row = await upsertOverride(transaction, {
      adminId: target.id,
      effect: input.effect,
      expiresAt: input.expiresAt ?? null,
      grantedBy: actor.adminId,
      permissionId: permission.id,
      reason: input.reason,
    });
    await recordAdminAudit(
      {
        action: "team.admins.override_set",
        adminId: actor.adminId,
        module: MODULE,
        newValues: { effect: input.effect, expiresAt: input.expiresAt, permission: permission.code, reason: input.reason },
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
    return { id: row.id.toString() };
  });
}

export async function removeTeamAdminOverride(actor: TeamActor, publicId: string, overrideId: string): Promise<void> {
  await runInTransaction(async (transaction) => {
    const target = await requireTarget(transaction, publicId);
    assertMayTouch(actor, target);
    assertNotSelf(actor, target, "نمی‌توانید دسترسی‌های حساب خودتان را تغییر دهید.");
    const override = await findOverride(transaction, target.id, BigInt(overrideId));
    if (!override) throw new ApiError(404, API_ERROR_CODES.notFound, "این استثنای دسترسی پیدا نشد.");
    await deleteOverride(transaction, override.id);
    await recordAdminAudit(
      {
        action: "team.admins.override_remove",
        adminId: actor.adminId,
        module: MODULE,
        oldValues: { effect: override.effect, permission: override.permission.code, reason: override.reason },
        request: actor.request,
        subject: { id: target.id, type: ADMIN_SUBJECT },
      },
      transaction,
    );
  });
}

// ====================================================================== roles

export interface TeamRoleListItem {
  code: string;
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  isSystem: boolean;
  members: number;
  name: string;
  permissions: string[];
}

export async function listTeamRoles(query: RolesListQuery) {
  const now = systemClock.now();
  // Roles are few: load them once (search applied) and split by view in memory, so the tabs get counts.
  const [rows, permissions] = await Promise.all([listRoleRows({ q: query.q, view: "all" }, now), listPermissions()]);
  const all = rows.map<TeamRoleListItem>((row) => ({
    code: row.code,
    createdAt: row.createdAt.toISOString(),
    description: row.description,
    id: row.id.toString(),
    isActive: row.isActive === 1,
    isSystem: row.isSystem === 1,
    members: row._count.adminRoleAssignments,
    name: row.name,
    permissions: row.adminRolePermissions.map((entry) => entry.permission.code),
  }));
  // System role, then roles in use, then newest: real roles stay above unused test leftovers.
  all.sort(
    (a, b) =>
      Number(b.isSystem) - Number(a.isSystem) ||
      Number(b.members > 0) - Number(a.members > 0) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const views = {
    all,
    assigned: all.filter((role) => role.members > 0),
    inactive: all.filter((role) => !role.isActive),
    unassigned: all.filter((role) => role.members === 0),
  };
  return {
    counts: Object.fromEntries(Object.entries(views).map(([key, list]) => [key, list.length])) as Record<keyof typeof views, number>,
    items: views[query.view],
    permissionCodes: permissions.filter((row) => row.isActive === 1).map((row) => row.code),
  };
}

export async function getTeamRoleDetail(roleId: string) {
  const now = systemClock.now();
  const role = await findRoleById(prisma, BigInt(roleId));
  if (!role) return null;
  const [members, permissions, history] = await Promise.all([
    listRoleMembers(role.id, now),
    listPermissions(),
    listAuditForSubjectOrActor({ subject: { id: role.id, type: ROLE_SUBJECT } }, 15),
  ]);
  return {
    history: await mapAuditRows(history),
    members: members.map((row) => ({
      assignedAt: row.createdAt.toISOString(),
      expiresAt: iso(row.expiresAt),
      id: row.admin.publicId,
      image: row.admin.image,
      isActive: row.admin.isActive === 1,
      name: row.admin.name,
      phone: row.admin.phone,
    })),
    permissionCodes: permissions.filter((row) => row.isActive === 1).map((row) => row.code),
    role: {
      code: role.code,
      createdAt: role.createdAt.toISOString(),
      createdBy: role.createdByAdmin?.name ?? null,
      description: role.description,
      id: role.id.toString(),
      isActive: role.isActive === 1,
      isSystem: role.isSystem === 1,
      name: role.name,
      permissions: role.adminRolePermissions.map((entry) => entry.permission.code),
      updatedAt: role.updatedAt.toISOString(),
    },
  };
}
export type TeamRoleDetail = NonNullable<Awaited<ReturnType<typeof getTeamRoleDetail>>>;

async function resolvePermissionIds(transaction: TransactionClient, codes: string[]) {
  const all = await listPermissions(transaction);
  const byCode = new Map(all.filter((row) => row.isActive === 1).map((row) => [row.code, row.id]));
  const unknown = codes.filter((code) => !byCode.has(code));
  if (unknown.length) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, `دسترسی نامعتبر: ${unknown.join("، ")}`, {
      fields: { permissions: ["یکی از دسترسی‌ها معتبر نیست."] },
    });
  }
  return [...new Set(codes)].map((code) => byCode.get(code)!);
}

export async function createTeamRole(actor: TeamActor, input: RoleCreateInput): Promise<{ id: string }> {
  assertGrantable(actor, input.permissions);
  try {
    const created = await runInTransaction(async (transaction) => {
      const code = input.code ?? `role_${createPublicId().slice(-10).toLowerCase()}`;
      if (await findRoleIdByCode(transaction, code)) conflict("این کد برای نقش دیگری ثبت شده است.", "code");
      const permissionIds = await resolvePermissionIds(transaction, input.permissions);
      const role = await insertRole(transaction, {
        code,
        createdByAdminId: actor.adminId,
        description: input.description,
        isActive: input.isActive ? 1 : 0,
        isSystem: 0,
        name: input.name,
      });
      await replaceRolePermissions(transaction, { grantedBy: actor.adminId, permissionIds, roleId: role.id });
      await recordAdminAudit(
        {
          action: "team.roles.create",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { code, description: input.description, isActive: input.isActive, name: input.name, permissions: input.permissions },
          request: actor.request,
          subject: { id: role.id, type: ROLE_SUBJECT },
        },
        transaction,
      );
      return role;
    });
    return { id: created.id.toString() };
  } catch (error) {
    rethrow(error);
  }
}

export async function updateTeamRole(actor: TeamActor, roleId: string, input: RoleUpdateInput): Promise<void> {
  try {
    await runInTransaction(async (transaction) => {
      const role = await findRoleById(transaction, BigInt(roleId));
      if (!role) throw new ApiError(404, API_ERROR_CODES.notFound, "نقش پیدا نشد.");
      const current = role.adminRolePermissions.map((entry) => entry.permission.code);
      const isSystem = role.isSystem === 1 || role.code === SYSTEM_ROLE_CODE;

      if (isSystem) {
        if (!actor.access.isSuperAdmin) forbidden("نقش سیستمی را فقط مدیر ارشد می‌تواند ویرایش کند.");
        const sameSet = current.length === input.permissions.length && input.permissions.every((code) => current.includes(code));
        if (!sameSet || !input.isActive) forbidden("دسترسی‌ها و وضعیت نقش سیستمی قابل تغییر نیست.");
      }
      const added = input.permissions.filter((code) => !current.includes(code));
      assertGrantable(actor, added);

      const permissionIds = await resolvePermissionIds(transaction, input.permissions);
      await updateRoleRow(transaction, role.id, {
        description: input.description,
        isActive: input.isActive ? 1 : 0,
        name: input.name,
      });
      if (!isSystem) await replaceRolePermissions(transaction, { grantedBy: actor.adminId, permissionIds, roleId: role.id });
      await recordAdminAudit(
        {
          action: "team.roles.update",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { description: input.description, isActive: input.isActive, name: input.name, permissions: input.permissions },
          oldValues: { description: role.description, isActive: role.isActive === 1, name: role.name, permissions: current },
          request: actor.request,
          subject: { id: role.id, type: ROLE_SUBJECT },
        },
        transaction,
      );
    });
  } catch (error) {
    rethrow(error);
  }
}

export async function deleteTeamRole(actor: TeamActor, roleId: string, input: { unassign: boolean }): Promise<void> {
  await runInTransaction(async (transaction) => {
    const role = await findRoleById(transaction, BigInt(roleId));
    if (!role) throw new ApiError(404, API_ERROR_CODES.notFound, "نقش پیدا نشد.");
    if (role.isSystem === 1 || role.code === SYSTEM_ROLE_CODE) forbidden("نقش سیستمی قابل حذف نیست.");

    const members = await countRoleAssignments(transaction, role.id);
    if (members > 0 && !input.unassign) {
      conflict(`این نقش به ${members} مدیر داده شده است؛ برای حذف، ابتدا آن را از مدیران بگیرید.`);
    }
    const removed = await deleteRoleAssignments(transaction, role.id);
    await updateRoleRow(transaction, role.id, {
      code: `${role.code.slice(0, 70)}_deleted_${role.id.toString()}`,
      deletedAt: systemClock.now(),
      isActive: 0,
    });
    await recordAdminAudit(
      {
        action: "team.roles.delete",
        adminId: actor.adminId,
        metadata: { unassigned: removed },
        module: MODULE,
        oldValues: { code: role.code, name: role.name, permissions: role.adminRolePermissions.map((entry) => entry.permission.code) },
        request: actor.request,
        subject: { id: role.id, type: ROLE_SUBJECT },
      },
      transaction,
    );
  });
}

export type { AuditEntry };
