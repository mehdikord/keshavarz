import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type { AdminsListQuery, AuditListQuery, RolesListQuery } from "@/server/modules/admin/team/team.schemas";

type Db = TransactionClient | typeof prisma;

const notExpired = (now: Date) => ({ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });

// ------------------------------------------------------------------ admins

function adminFilters(query: Pick<AdminsListQuery, "q" | "role">, now: Date): Prisma.AdminWhereInput {
  const q = query.q;
  return {
    deletedAt: null,
    ...(query.role
      ? { roleAssignments: { some: { roleId: BigInt(query.role), ...notExpired(now) } } }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            ...(/^[\x20-\x7e]+$/.test(q)
              ? [{ phone: { contains: q } }, { email: { contains: q.toLowerCase() } }, { publicId: q.toUpperCase() }]
              : []),
          ],
        }
      : {}),
  };
}

function adminStatusWhere(status: AdminsListQuery["status"], now: Date): Prisma.AdminWhereInput {
  if (status === "active") return { isActive: 1 };
  if (status === "inactive") return { isActive: 0 };
  if (status === "locked") return { lockedUntil: { gt: now } };
  return {};
}

export async function listAdminRows(query: AdminsListQuery, now: Date) {
  const where = { ...adminFilters(query, now), ...adminStatusWhere(query.status, now) };
  const [rows, total] = await Promise.all([
    prisma.admin.findMany({
      orderBy: [{ isSuperAdmin: "desc" }, { isActive: "desc" }, { createdAt: "asc" }],
      select: {
        createdAt: true,
        email: true,
        id: true,
        image: true,
        isActive: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        lockedUntil: true,
        name: true,
        phone: true,
        publicId: true,
        _count: {
          select: {
            adminSessions: { where: { expiresAt: { gt: now }, revokedAt: null } },
            permissionOverrides: { where: notExpired(now) },
          },
        },
        roleAssignments: {
          orderBy: { createdAt: "asc" },
          select: { expiresAt: true, role: { select: { id: true, isActive: true, name: true } } },
          where: { role: { deletedAt: null } },
        },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.admin.count({ where }),
  ]);
  return { rows, total };
}

export async function countAdminsPerStatus(query: Pick<AdminsListQuery, "q" | "role">, now: Date) {
  const base = adminFilters(query, now);
  const [all, active, inactive, locked] = await Promise.all([
    prisma.admin.count({ where: base }),
    prisma.admin.count({ where: { ...base, isActive: 1 } }),
    prisma.admin.count({ where: { ...base, isActive: 0 } }),
    prisma.admin.count({ where: { ...base, lockedUntil: { gt: now } } }),
  ]);
  return { active, all, inactive, locked };
}

export async function findAdminByPublicId(db: Db, publicId: string) {
  return db.admin.findFirst({
    select: {
      createdAt: true,
      createdByAdmin: { select: { name: true, publicId: true } },
      email: true,
      failedLoginAttempts: true,
      id: true,
      image: true,
      isActive: true,
      isSuperAdmin: true,
      lastLoginAt: true,
      lastLoginIp: true,
      lockedUntil: true,
      name: true,
      passwordChangedAt: true,
      phone: true,
      publicId: true,
      updatedAt: true,
    },
    where: { deletedAt: null, publicId },
  });
}

/** Row lock so concurrent "last super admin" checks serialise. */
export async function lockAdminRows(transaction: TransactionClient, ids: bigint[]) {
  if (ids.length === 0) return;
  for (const id of ids) {
    await transaction.$queryRaw`SELECT id FROM admins WHERE id = ${id} FOR UPDATE`;
  }
}

export async function countActiveSuperAdmins(db: Db, excludeId?: bigint) {
  return db.admin.count({
    where: { deletedAt: null, isActive: 1, isSuperAdmin: 1, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
}

export async function findAdminIdByPhone(db: Db, phone: string) {
  return db.admin.findUnique({ select: { deletedAt: true, id: true }, where: { phone } });
}

export async function findAdminIdByEmail(db: Db, email: string) {
  return db.admin.findUnique({ select: { id: true }, where: { email } });
}

export async function insertAdmin(db: Db, data: Prisma.AdminUncheckedCreateInput) {
  return db.admin.create({ data, select: { id: true, publicId: true } });
}

export async function updateAdminRow(db: Db, id: bigint, data: Prisma.AdminUncheckedUpdateInput) {
  await db.admin.update({ data: { ...data, updatedAt: new Date() }, where: { id } });
}

export async function revokeAdminSessions(
  db: Db,
  input: { adminId: bigint; exceptSessionId?: bigint; now: Date; sessionPublicId?: string },
) {
  const result = await db.adminSession.updateMany({
    data: { revokedAt: input.now },
    where: {
      adminId: input.adminId,
      expiresAt: { gt: input.now },
      revokedAt: null,
      ...(input.sessionPublicId ? { publicId: input.sessionPublicId } : {}),
      ...(input.exceptSessionId ? { id: { not: input.exceptSessionId } } : {}),
    },
  });
  return result.count;
}

export async function listAdminSessions(adminId: bigint, now: Date) {
  return prisma.adminSession.findMany({
    orderBy: [{ revokedAt: { sort: "asc", nulls: "first" } }, { lastActivityAt: "desc" }],
    select: {
      createdAt: true,
      expiresAt: true,
      id: true,
      ipAddress: true,
      lastActivityAt: true,
      publicId: true,
      revokedAt: true,
      userAgent: true,
    },
    take: 20,
    where: { adminId, OR: [{ expiresAt: { gt: now }, revokedAt: null }, { createdAt: { gt: new Date(now.getTime() - 30 * 86_400_000) } }] },
  });
}

export async function listAdminAssignments(db: Db, adminId: bigint) {
  return db.adminRoleAssignment.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      assignedByAdmin: { select: { name: true } },
      createdAt: true,
      expiresAt: true,
      id: true,
      role: {
        select: {
          adminRolePermissions: { select: { permission: { select: { code: true } } } },
          code: true,
          id: true,
          isActive: true,
          isSystem: true,
          name: true,
        },
      },
      roleId: true,
    },
    where: { adminId, role: { deletedAt: null } },
  });
}

export async function listAdminOverrides(db: Db, adminId: bigint) {
  return db.adminPermissionOverride.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      effect: true,
      expiresAt: true,
      grantedByAdmin: { select: { name: true } },
      id: true,
      permission: { select: { code: true, id: true } },
      reason: true,
    },
    where: { adminId },
  });
}

export async function replaceRoleAssignments(
  transaction: TransactionClient,
  input: { adminId: bigint; assignedBy: bigint; roles: Array<{ expiresAt: Date | null; roleId: bigint }> },
) {
  const keep = input.roles.map((row) => row.roleId);
  await transaction.adminRoleAssignment.deleteMany({
    where: { adminId: input.adminId, ...(keep.length ? { roleId: { notIn: keep } } : {}) },
  });
  for (const row of input.roles) {
    await transaction.adminRoleAssignment.upsert({
      create: { adminId: input.adminId, assignedByAdminId: input.assignedBy, expiresAt: row.expiresAt, roleId: row.roleId },
      update: { assignedByAdminId: input.assignedBy, expiresAt: row.expiresAt, updatedAt: new Date() },
      where: { adminId_roleId: { adminId: input.adminId, roleId: row.roleId } },
    });
  }
}

export async function upsertOverride(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    effect: "allow" | "deny";
    expiresAt: Date | null;
    grantedBy: bigint;
    permissionId: bigint;
    reason: string;
  },
) {
  return transaction.adminPermissionOverride.upsert({
    create: {
      adminId: input.adminId,
      effect: input.effect,
      expiresAt: input.expiresAt,
      grantedByAdminId: input.grantedBy,
      permissionId: input.permissionId,
      reason: input.reason,
    },
    select: { id: true },
    update: {
      effect: input.effect,
      expiresAt: input.expiresAt,
      grantedByAdminId: input.grantedBy,
      reason: input.reason,
      updatedAt: new Date(),
    },
    where: { adminId_permissionId: { adminId: input.adminId, permissionId: input.permissionId } },
  });
}

export async function findOverride(db: Db, adminId: bigint, overrideId: bigint) {
  return db.adminPermissionOverride.findFirst({
    select: { effect: true, expiresAt: true, id: true, permission: { select: { code: true } }, reason: true },
    where: { adminId, id: overrideId },
  });
}

export async function deleteOverride(db: Db, id: bigint) {
  await db.adminPermissionOverride.delete({ where: { id } });
}

// ------------------------------------------------------------- permissions

export async function listPermissions(db: Db = prisma) {
  return db.adminPermission.findMany({
    orderBy: [{ id: "asc" }],
    select: { code: true, id: true, isActive: true, module: true },
  });
}

// ------------------------------------------------------------------- roles

export async function listRoleRows(query: RolesListQuery, now: Date) {
  const q = query.q;
  return prisma.adminRole.findMany({
    orderBy: [{ isSystem: "desc" }, { isActive: "desc" }, { createdAt: "asc" }],
    select: {
      code: true,
      createdAt: true,
      description: true,
      id: true,
      isActive: true,
      isSystem: true,
      name: true,
      adminRolePermissions: { select: { permission: { select: { code: true } } } },
      _count: {
        select: {
          adminRoleAssignments: { where: { ...notExpired(now), admin: { deletedAt: null } } },
        },
      },
    },
    where: {
      deletedAt: null,
      ...(query.view === "inactive" ? { isActive: 0 } : {}),
      ...(query.view === "assigned"
        ? { adminRoleAssignments: { some: { ...notExpired(now), admin: { deletedAt: null } } } }
        : {}),
      ...(query.view === "unassigned"
        ? { adminRoleAssignments: { none: { ...notExpired(now), admin: { deletedAt: null } } } }
        : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, ...(/^[\x20-\x7e]+$/.test(q) ? [{ code: { contains: q.toLowerCase() } }] : [])] }
        : {}),
    },
  });
}

export async function listRoleOptions() {
  return prisma.adminRole.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }, { id: "asc" }],
    select: {
      adminRolePermissions: { select: { permission: { select: { code: true } } } },
      code: true,
      id: true,
      isActive: true,
      isSystem: true,
      name: true,
    },
    where: { deletedAt: null },
  });
}

export async function findRoleById(db: Db, id: bigint) {
  return db.adminRole.findFirst({
    select: {
      code: true,
      createdAt: true,
      createdByAdmin: { select: { name: true } },
      description: true,
      id: true,
      isActive: true,
      isSystem: true,
      name: true,
      adminRolePermissions: { select: { permission: { select: { code: true } } } },
      updatedAt: true,
    },
    where: { deletedAt: null, id },
  });
}

export async function findRolesByIds(db: Db, ids: bigint[]) {
  if (ids.length === 0) return [];
  return db.adminRole.findMany({
    select: {
      adminRolePermissions: { select: { permission: { select: { code: true } } } },
      id: true,
      isActive: true,
      isSystem: true,
      name: true,
    },
    where: { deletedAt: null, id: { in: ids } },
  });
}

export async function listRoleMembers(roleId: bigint, now: Date) {
  return prisma.adminRoleAssignment.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      admin: { select: { image: true, isActive: true, name: true, phone: true, publicId: true } },
      createdAt: true,
      expiresAt: true,
    },
    where: { admin: { deletedAt: null }, roleId, ...notExpired(now) },
  });
}

export async function countRoleAssignments(db: Db, roleId: bigint) {
  return db.adminRoleAssignment.count({ where: { roleId, admin: { deletedAt: null } } });
}

export async function findRoleIdByCode(db: Db, code: string) {
  return db.adminRole.findUnique({ select: { id: true }, where: { code } });
}

export async function insertRole(db: Db, data: Prisma.AdminRoleUncheckedCreateInput) {
  return db.adminRole.create({ data, select: { id: true } });
}

export async function updateRoleRow(db: Db, id: bigint, data: Prisma.AdminRoleUncheckedUpdateInput) {
  await db.adminRole.update({ data: { ...data, updatedAt: new Date() }, where: { id } });
}

export async function replaceRolePermissions(
  transaction: TransactionClient,
  input: { grantedBy: bigint; permissionIds: bigint[]; roleId: bigint },
) {
  await transaction.adminRolePermission.deleteMany({
    where: { roleId: input.roleId, ...(input.permissionIds.length ? { permissionId: { notIn: input.permissionIds } } : {}) },
  });
  const existing = await transaction.adminRolePermission.findMany({
    select: { permissionId: true },
    where: { roleId: input.roleId },
  });
  const have = new Set(existing.map((row) => row.permissionId.toString()));
  const missing = input.permissionIds.filter((id) => !have.has(id.toString()));
  if (missing.length) {
    await transaction.adminRolePermission.createMany({
      data: missing.map((permissionId) => ({ grantedByAdminId: input.grantedBy, permissionId, roleId: input.roleId })),
    });
  }
}

export async function deleteRoleAssignments(db: Db, roleId: bigint) {
  const result = await db.adminRoleAssignment.deleteMany({ where: { roleId } });
  return result.count;
}

// ------------------------------------------------------------------- audit

export function auditWhere(query: AuditListQuery, range: { from?: Date; to?: Date }, actorId?: bigint | null): Prisma.AdminAuditLogWhereInput {
  return {
    ...(query.actor === "system" ? { adminId: null } : actorId ? { adminId: actorId } : {}),
    ...(query.module ? { module: query.module } : {}),
    ...(query.action && /^[\x20-\x7e]+$/.test(query.action) ? { action: { contains: query.action } } : {}),
    ...(query.subjectType ? { auditableType: query.subjectType } : {}),
    ...(query.subjectId && /^\d{1,19}$/.test(query.subjectId) ? { auditableId: BigInt(query.subjectId) } : {}),
    ...(query.ip && /^[0-9a-fA-F:.]+$/.test(query.ip) ? { ipAddress: { startsWith: query.ip } } : {}),
    ...(range.from || range.to
      ? { createdAt: { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lt: range.to } : {}) } }
      : {}),
  };
}

const AUDIT_SELECT = {
  action: true,
  admin: { select: { image: true, name: true, publicId: true } },
  auditableId: true,
  auditableType: true,
  createdAt: true,
  httpMethod: true,
  id: true,
  ipAddress: true,
  module: true,
  route: true,
} as const;

export async function listAuditRows(where: Prisma.AdminAuditLogWhereInput, skip: number, take: number) {
  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({ orderBy: { id: "desc" }, select: AUDIT_SELECT, skip, take, where }),
    prisma.adminAuditLog.count({ where }),
  ]);
  return { rows, total };
}

export async function findAuditRow(id: bigint) {
  return prisma.adminAuditLog.findUnique({
    select: { ...AUDIT_SELECT, metadata: true, newValues: true, oldValues: true, userAgent: true },
    where: { id },
  });
}

export async function listAuditFacets() {
  const [modules, types, admins] = await Promise.all([
    prisma.adminAuditLog.groupBy({ _count: { _all: true }, by: ["module"], orderBy: { module: "asc" } }),
    prisma.adminAuditLog.groupBy({
      _count: { _all: true },
      by: ["auditableType"],
      orderBy: { auditableType: "asc" },
      where: { auditableType: { not: null } },
    }),
    prisma.admin.findMany({ orderBy: { name: "asc" }, select: { name: true, publicId: true } }),
  ]);
  return { admins, modules, types };
}

export async function findAdminIdByPublicIdAny(publicId: string) {
  return prisma.admin.findUnique({ select: { id: true }, where: { publicId } });
}

export async function listAuditForSubjectOrActor(input: { actorId?: bigint; subject?: { id: bigint; type: string } }, take = 15) {
  return prisma.adminAuditLog.findMany({
    orderBy: { id: "desc" },
    select: AUDIT_SELECT,
    take,
    where: input.subject
      ? { auditableId: input.subject.id, auditableType: input.subject.type }
      : { adminId: input.actorId },
  });
}

/** Public ids for audit subjects, so the viewer can link to their pages. */
export async function resolveSubjectRefs(subjects: Array<{ id: bigint; type: string }>) {
  const ids = (type: string | string[]) => {
    const types = Array.isArray(type) ? type : [type];
    return [...new Set(subjects.filter((row) => types.includes(row.type)).map((row) => row.id))];
  };
  const [users, requests, providers, payments, admins, services, categories, subscriptions, plans, roles] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, publicId: true }, where: { id: { in: ids("user") } } }),
    prisma.serviceRequest.findMany({
      select: { id: true, publicId: true, serviceNameSnapshot: true },
      where: { id: { in: ids("service_request") } },
    }),
    prisma.providerProfile.findMany({
      select: { id: true, user: { select: { name: true, publicId: true } } },
      where: { id: { in: ids("provider_profile") } },
    }),
    prisma.subscriptionPayment.findMany({
      select: { id: true, publicId: true },
      where: { id: { in: ids("subscription_payment") } },
    }),
    prisma.admin.findMany({ select: { id: true, name: true, publicId: true }, where: { id: { in: ids("admin") } } }),
    prisma.service.findMany({ select: { id: true, name: true }, where: { id: { in: ids("service") } } }),
    prisma.serviceCategory.findMany({
      select: { id: true, name: true },
      where: { id: { in: ids(["service_category", "ServiceCategory"]) } },
    }),
    prisma.providerSubscription.findMany({
      select: { id: true, planNameSnapshot: true, providerProfile: { select: { user: { select: { phone: true } } } } },
      where: { id: { in: ids("provider_subscription") } },
    }),
    prisma.subscriptionPlan.findMany({ select: { id: true, name: true }, where: { id: { in: ids("subscription_plan") } } }),
    prisma.adminRole.findMany({ select: { id: true, name: true }, where: { id: { in: ids("admin_role") } } }),
  ]);
  return { admins, categories, payments, plans, providers, requests, roles, services, subscriptions, users };
}
