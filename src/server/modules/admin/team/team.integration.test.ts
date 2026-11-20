import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { resolveAdminAccess } from "@/server/modules/admin/access/admin-access.service";
import { changeOwnPassword, revokeOwnSessions } from "@/server/modules/admin/account/account.service";
import { listAuditEntries } from "@/server/modules/admin/team/audit-viewer.service";
import { AdminCreateSchema, AuditListQuerySchema, RoleCreateSchema } from "@/server/modules/admin/team/team.schemas";
import {
  createTeamAdmin,
  createTeamRole,
  deleteTeamRole,
  getTeamAdminDetail,
  removeTeamAdminOverride,
  resetTeamAdminPassword,
  setTeamAdminRoles,
  setTeamAdminStatus,
  type TeamActor,
  updateTeamAdmin,
  updateTeamRole,
  upsertTeamAdminOverride,
} from "@/server/modules/admin/team/team.service";
import { hashPassword, verifyPassword } from "@/server/security";

const PHONES = ["09996800001", "09996800002", "09996800003", "09996800004", "09996800005"];
const ROLE_NAME = "نقش آزمون تیم";

const request = new NextRequest("http://localhost/api/admins/v1/team/admins", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.8" },
  method: "POST",
});

let superActor: TeamActor;
let managerActor: TeamActor;
let superId: bigint;
let managerId: bigint;

async function cleanup() {
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: { in: PHONES } } });
  const ids = admins.map((row) => row.id);
  const roles = await prisma.adminRole.findMany({ select: { id: true }, where: { name: { startsWith: ROLE_NAME } } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: ids } } });
  await prisma.adminAuditLog.deleteMany({ where: { auditableType: "admin_role", auditableId: { in: roles.map((row) => row.id) } } });
  await prisma.adminSession.deleteMany({ where: { adminId: { in: ids } } });
  await prisma.adminPermissionOverride.deleteMany({ where: { adminId: { in: ids } } });
  await prisma.adminRoleAssignment.deleteMany({ where: { OR: [{ adminId: { in: ids } }, { roleId: { in: roles.map((row) => row.id) } }] } });
  await prisma.adminRolePermission.deleteMany({ where: { roleId: { in: roles.map((row) => row.id) } } });
  await prisma.adminRole.deleteMany({ where: { id: { in: roles.map((row) => row.id) } } });
  await prisma.admin.updateMany({ data: { createdByAdminId: null }, where: { id: { in: ids } } });
  await prisma.admin.deleteMany({ where: { id: { in: ids } } });
}

async function session(adminId: bigint) {
  return prisma.adminSession.create({
    data: {
      adminId,
      expiresAt: new Date(Date.now() + 3_600_000),
      publicId: createPublicId(),
      tokenHash: createPublicId().padEnd(64, "x").slice(0, 64),
    },
  });
}

describe.sequential("admin team management", () => {
  let roleId: string;
  let staffPublicId: string;

  beforeAll(async () => {
    await cleanup();
    const password = await hashPassword("Initial-Pass-1234");
    const sup = await prisma.admin.create({
      data: { isSuperAdmin: 1, name: "ارشد آزمون", password, phone: PHONES[0]!, publicId: createPublicId() },
    });
    superId = sup.id;
    const manager = await prisma.admin.create({
      data: { name: "مدیر محدود آزمون", password, phone: PHONES[1]!, publicId: createPublicId() },
    });
    managerId = manager.id;
    superActor = { access: { isSuperAdmin: true, permissions: [] }, adminId: superId, request };
    // The manager may manage admins and roles, but holds nothing about payments.
    managerActor = {
      access: {
        isSuperAdmin: false,
        permissions: [ADMIN_PERMISSIONS.adminsView, ADMIN_PERMISSIONS.adminsManage, ADMIN_PERMISSIONS.rolesManage, ADMIN_PERMISSIONS.usersView],
      },
      adminId: managerId,
      request,
    };
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("creates roles only from permissions the actor holds", async () => {
    await expect(
      createTeamRole(managerActor, RoleCreateSchema.parse({ name: `${ROLE_NAME} پرداخت`, permissions: [ADMIN_PERMISSIONS.paymentsRefund] })),
    ).rejects.toMatchObject({ status: 403 });

    const created = await createTeamRole(
      managerActor,
      RoleCreateSchema.parse({ name: ROLE_NAME, permissions: [ADMIN_PERMISSIONS.usersView] }),
    );
    roleId = created.id;
    const role = await prisma.adminRole.findUniqueOrThrow({ where: { id: BigInt(roleId) } });
    expect(role.code).toMatch(/^role_[0-9a-z]{10}$/);

    await expect(
      updateTeamRole(managerActor, roleId, {
        description: null,
        isActive: true,
        name: ROLE_NAME,
        permissions: [ADMIN_PERMISSIONS.usersView, ADMIN_PERMISSIONS.paymentsView],
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("creates an admin with a generated password and assigned role; access follows roles and overrides", async () => {
    const result = await createTeamAdmin(
      managerActor,
      AdminCreateSchema.parse({ name: "کارمند آزمون", phone: PHONES[2], roleIds: [roleId] }),
    );
    staffPublicId = result.id;
    expect(result.password).toMatch(/^[A-Za-z2-9]{16}$/);
    const staff = await prisma.admin.findUniqueOrThrow({ where: { publicId: staffPublicId } });
    expect(await verifyPassword(staff.password, result.password!)).toBe(true);

    expect((await resolveAdminAccess(staff.id)).permissions).toEqual([ADMIN_PERMISSIONS.usersView]);

    // Allow: only for permissions the actor holds.
    await expect(
      upsertTeamAdminOverride(managerActor, staffPublicId, {
        effect: "allow",
        expiresAt: null,
        permission: ADMIN_PERMISSIONS.paymentsRefund,
        reason: "آزمون دسترسی",
      }),
    ).rejects.toMatchObject({ status: 403 });
    await upsertTeamAdminOverride(managerActor, staffPublicId, {
      effect: "allow",
      expiresAt: null,
      permission: ADMIN_PERMISSIONS.adminsView,
      reason: "آزمون دسترسی",
    });
    const deny = await upsertTeamAdminOverride(managerActor, staffPublicId, {
      effect: "deny",
      expiresAt: null,
      permission: ADMIN_PERMISSIONS.usersView,
      reason: "آزمون منع",
    });
    expect((await resolveAdminAccess(staff.id)).permissions).toEqual([ADMIN_PERMISSIONS.adminsView]);

    await removeTeamAdminOverride(managerActor, staffPublicId, deny.id);
    expect((await resolveAdminAccess(staff.id)).permissions).toEqual([ADMIN_PERMISSIONS.adminsView, ADMIN_PERMISSIONS.usersView]);

    // An expired role assignment stops granting.
    await prisma.adminRoleAssignment.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) }, where: { adminId: staff.id } });
    expect((await resolveAdminAccess(staff.id)).permissions).toEqual([ADMIN_PERMISSIONS.adminsView]);
    await setTeamAdminRoles(managerActor, staffPublicId, { roles: [{ expiresAt: null, roleId }] });
    expect((await resolveAdminAccess(staff.id)).permissions).toContain(ADMIN_PERMISSIONS.usersView);
  });

  it("enforces the self, super-admin and last-super-admin rules", async () => {
    const manager = await prisma.admin.findUniqueOrThrow({ where: { id: managerId } });
    const sup = await prisma.admin.findUniqueOrThrow({ where: { id: superId } });

    await expect(setTeamAdminStatus(managerActor, manager.publicId, { isActive: false, reason: "خودم را غیرفعال کنم" })).rejects.toMatchObject({ status: 403 });
    await expect(setTeamAdminRoles(managerActor, manager.publicId, { roles: [] })).rejects.toMatchObject({ status: 403 });
    // A non-super admin can't touch a super admin or create one.
    await expect(setTeamAdminStatus(managerActor, sup.publicId, { isActive: false, reason: "آزمون قانون ارشد" })).rejects.toMatchObject({ status: 403 });
    await expect(
      createTeamAdmin(managerActor, AdminCreateSchema.parse({ isSuperAdmin: true, name: "ارشد جعلی", phone: PHONES[3] })),
    ).rejects.toMatchObject({ status: 403 });
    await expect(resetTeamAdminPassword(managerActor, sup.publicId, {})).rejects.toMatchObject({ status: 403 });

    // Super admin can't demote themselves.
    await expect(
      updateTeamAdmin(superActor, sup.publicId, { email: null, isSuperAdmin: false, name: sup.name, phone: sup.phone }),
    ).rejects.toMatchObject({ status: 403 });

    // Promote the staff member, then the last-super-admin guard kicks in when only one remains.
    await updateTeamAdmin(superActor, staffPublicId, { email: null, isSuperAdmin: true, name: "کارمند آزمون", phone: PHONES[2]! });
    const staffActor: TeamActor = { access: { isSuperAdmin: true, permissions: [] }, adminId: (await prisma.admin.findUniqueOrThrow({ where: { publicId: staffPublicId } })).id, request };

    // Make every other real super admin invisible to the count by checking against a deactivation that would leave none:
    const others = await prisma.admin.count({
      where: { deletedAt: null, isActive: 1, isSuperAdmin: 1, phone: { notIn: PHONES } },
    });
    if (others === 0) {
      await setTeamAdminStatus(staffActor, sup.publicId, { isActive: false, reason: "آزمون آخرین ارشد" });
      await expect(
        updateTeamAdmin(superActor, staffPublicId, { email: null, isSuperAdmin: false, name: "کارمند آزمون", phone: PHONES[2]! }),
      ).rejects.toMatchObject({ status: 409 });
      await setTeamAdminStatus(staffActor, sup.publicId, { isActive: true, reason: "بازگرداندن ارشد" });
    }

    // Deactivation revokes every session of the target.
    const staffId = staffActor.adminId;
    await session(staffId);
    await session(staffId);
    await setTeamAdminStatus(superActor, staffPublicId, { isActive: false, reason: "آزمون غیرفعال" });
    expect(await prisma.adminSession.count({ where: { adminId: staffId, revokedAt: null } })).toBe(0);
    expect((await resolveAdminAccess(staffId)).isSuperAdmin).toBe(false);
  });

  it("resets passwords, blocks deleting assigned roles unless unassigning", async () => {
    const reset = await resetTeamAdminPassword(superActor, staffPublicId, {});
    const staff = await prisma.admin.findUniqueOrThrow({ where: { publicId: staffPublicId } });
    expect(await verifyPassword(staff.password, reset.password!)).toBe(true);

    await expect(deleteTeamRole(managerActor, roleId, { unassign: false })).rejects.toMatchObject({ status: 409 });
    await deleteTeamRole(managerActor, roleId, { unassign: true });
    const role = await prisma.adminRole.findUniqueOrThrow({ where: { id: BigInt(roleId) } });
    expect(role.deletedAt).not.toBeNull();
    expect(await prisma.adminRoleAssignment.count({ where: { roleId: role.id } })).toBe(0);

    const platform = await prisma.adminRole.findUnique({ where: { code: "platform_admin" } });
    if (platform) {
      await expect(deleteTeamRole(superActor, platform.id.toString(), { unassign: true })).rejects.toMatchObject({ status: 403 });
    }

    const detail = await getTeamAdminDetail(staffPublicId);
    expect(detail?.changes.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["team.admins.create", "team.admins.password_reset", "team.admins.deactivate"]),
    );
  });

  it("changes the own password with the current one and keeps only this session", async () => {
    const current = await session(managerId);
    const other = await session(managerId);
    await expect(
      changeOwnPassword({ adminId: managerId, sessionId: current.id }, { currentPassword: "wrong", newPassword: "New-Pass-56789" }),
    ).rejects.toMatchObject({ status: 400 });
    const result = await changeOwnPassword(
      { adminId: managerId, sessionId: current.id },
      { currentPassword: "Initial-Pass-1234", newPassword: "New-Pass-56789" },
    );
    expect(result.revoked).toBeGreaterThanOrEqual(1);
    expect((await prisma.adminSession.findUniqueOrThrow({ where: { id: other.id } })).revokedAt).not.toBeNull();
    expect((await prisma.adminSession.findUniqueOrThrow({ where: { id: current.id } })).revokedAt).toBeNull();
    await expect(
      revokeOwnSessions({ adminId: managerId, sessionId: current.id }, { sessionId: current.publicId! }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("filters the audit log and links subjects", async () => {
    const manager = await prisma.admin.findUniqueOrThrow({ where: { id: managerId } });
    const list = await listAuditEntries(AuditListQuerySchema.parse({ actor: manager.publicId, module: "team" }));
    expect(list.total).toBeGreaterThan(0);
    const created = list.items.find((item) => item.action === "team.admins.create");
    expect(created?.subject).toMatchObject({ href: `/admins/team/admins/${staffPublicId}`, type: "admin" });
  });
});
