import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import { assertAdminCan, resolveAdminAccess } from "@/server/modules/admin/access/admin-access.service";
import { lockoutSecondsFor } from "@/server/modules/admin/auth/admin-auth.service";
import { getDashboardOverview } from "@/server/modules/admin/dashboard/dashboard.service";
import { UsersListQuerySchema } from "@/server/modules/admin/users/users.schemas";
import {
  addAdminUserNote,
  deleteAdminUser,
  deleteAdminUserNote,
  getAdminUserHeader,
  getUserHistoryTab,
  getUserOverviewTab,
  listAdminUsers,
  moderateAdminUser,
  restoreAdminUser,
  revokeAdminUserSessions,
  setAdminUserNotePinned,
  updateAdminUser,
} from "@/server/modules/admin/users/users.service";

const ADMIN_PHONE = "09996100001";
const USER_PHONE = "09996100002";
const OTHER_PHONE = "09996100003";
const ROLE_CODE = "test_admin_panel_role";

const request = new NextRequest("http://localhost/api/admins/v1/users/test", {
  headers: { "user-agent": "vitest", "x-forwarded-for": "10.0.0.1" },
  method: "POST",
});

let adminId: bigint;
let userPublicId: string;
let userId: bigint;

async function cleanup() {
  const admins = await prisma.admin.findMany({ where: { phone: ADMIN_PHONE }, select: { id: true } });
  const adminIds = admins.map((admin) => admin.id);
  const users = await prisma.user.findMany({ where: { phone: { in: [USER_PHONE, OTHER_PHONE] } }, select: { id: true } });
  const userIds = users.map((user) => user.id);

  await prisma.userAdminNote.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userModerationAction.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: adminIds } } });
  await prisma.adminPermissionOverride.deleteMany({ where: { adminId: { in: adminIds } } });
  await prisma.adminRoleAssignment.deleteMany({ where: { adminId: { in: adminIds } } });
  await prisma.adminRole.deleteMany({ where: { code: ROLE_CODE } });
  await prisma.admin.deleteMany({ where: { id: { in: adminIds } } });
}

describe.sequential("admin panel", () => {
  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر آزمون", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    adminId = admin.id;
    const user = await prisma.user.create({
      data: { name: "کاربر آزمون پنل", phone: USER_PHONE, publicId: createPublicId() },
    });
    userId = user.id;
    userPublicId = user.publicId;
    await prisma.user.create({ data: { name: "کاربر دیگر", phone: OTHER_PHONE, publicId: createPublicId() } });
    await prisma.userSession.createMany({
      data: [1, 2].map((index) => ({
        expiresAt: new Date(Date.now() + 86_400_000),
        publicId: createPublicId(),
        tokenHash: `${"a".repeat(63)}${index}`,
        userId: user.id,
      })),
    });
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("grows the login lockout after the threshold and caps it", () => {
    expect(lockoutSecondsFor(4)).toBe(0);
    expect(lockoutSecondsFor(5)).toBe(15 * 60);
    expect(lockoutSecondsFor(6)).toBe(30 * 60);
    expect(lockoutSecondsFor(40)).toBe(24 * 60 * 60);
  });

  it("resolves role grants and lets deny overrides win", async () => {
    const permissions = await prisma.adminPermission.findMany({
      where: { code: { in: [ADMIN_PERMISSIONS.usersView, ADMIN_PERMISSIONS.usersUpdate, ADMIN_PERMISSIONS.dashboardView] } },
    });
    const byCode = new Map(permissions.map((permission) => [permission.code, permission.id]));
    const role = await prisma.adminRole.create({
      data: {
        adminRolePermissions: {
          create: [
            { permissionId: byCode.get(ADMIN_PERMISSIONS.usersView)! },
            { permissionId: byCode.get(ADMIN_PERMISSIONS.dashboardView)! },
          ],
        },
        code: ROLE_CODE,
        name: "نقش آزمون",
      },
    });
    await prisma.adminRoleAssignment.create({ data: { adminId, roleId: role.id } });
    await prisma.adminPermissionOverride.createMany({
      data: [
        { adminId, effect: "allow", permissionId: byCode.get(ADMIN_PERMISSIONS.usersUpdate)! },
        { adminId, effect: "deny", permissionId: byCode.get(ADMIN_PERMISSIONS.dashboardView)! },
      ],
    });

    const access = await resolveAdminAccess(adminId);
    expect(access.isSuperAdmin).toBe(false);
    expect(access.permissions).toContain(ADMIN_PERMISSIONS.usersView);
    expect(access.permissions).toContain(ADMIN_PERMISSIONS.usersUpdate);
    expect(access.permissions).not.toContain(ADMIN_PERMISSIONS.dashboardView);
    expect(() => assertAdminCan(access, ADMIN_PERMISSIONS.usersChangeStatus)).toThrow();
  });

  it("finds users by phone and reports per-status counts", async () => {
    const list = await listAdminUsers(UsersListQuerySchema.parse({ q: "۰۹۹۹۶۱۰۰۰۰۲" }));
    expect(list.items.map((item) => item.id)).toEqual([userPublicId]);
    expect(list.items[0]!.status).toBe("active");
    expect(list.counts.active).toBe(1);
    expect(list.counts.all).toBe(1);
  });

  it("rejects a phone number that belongs to another account", async () => {
    await expect(
      updateAdminUser({ adminId, request }, userPublicId, {
        cityId: null,
        name: "کاربر آزمون پنل",
        phone: OTHER_PHONE,
        provinceId: null,
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("suspends (signing the user out everywhere), then lifts the suspension", async () => {
    await moderateAdminUser({ adminId, request }, userPublicId, {
      action: "suspend",
      endsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      reason: "آزمون تعلیق موقت",
    });
    let header = (await getAdminUserHeader(userPublicId))!.header;
    expect(header.status).toBe("suspended");
    expect(header.restriction?.reason).toBe("آزمون تعلیق موقت");
    expect(header.counters.activeSessions).toBe(0);

    const suspended = await listAdminUsers(UsersListQuerySchema.parse({ q: USER_PHONE, status: "suspended" }));
    expect(suspended.items).toHaveLength(1);

    await expect(
      moderateAdminUser({ adminId, request }, userPublicId, { action: "warning", reason: "اخطار حین تعلیق" }),
    ).resolves.toBeUndefined();

    await moderateAdminUser({ adminId, request }, userPublicId, { action: "unban", reason: "پایان آزمون تعلیق" });
    header = (await getAdminUserHeader(userPublicId))!.header;
    expect(header.status).toBe("active");

    await expect(
      moderateAdminUser({ adminId, request }, userPublicId, { action: "unban", reason: "رفع دوباره" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("deactivates and reactivates an account", async () => {
    await moderateAdminUser({ adminId, request }, userPublicId, { action: "deactivate", reason: "آزمون غیرفعال‌سازی" });
    expect((await getAdminUserHeader(userPublicId))!.header.status).toBe("inactive");
    await moderateAdminUser({ adminId, request }, userPublicId, { action: "activate", reason: "آزمون فعال‌سازی" });
    expect((await getAdminUserHeader(userPublicId))!.header.status).toBe("active");
  });

  it("keeps pinned notes first and soft-deletes them", async () => {
    const first = await addAdminUserNote({ adminId, request }, userPublicId, { body: "یادداشت معمولی", isPinned: false });
    const second = await addAdminUserNote({ adminId, request }, userPublicId, { body: "یادداشت مهم", isPinned: false });
    await setAdminUserNotePinned({ adminId, request }, userPublicId, first.id, true);

    let notes = (await getUserOverviewTab(userId)).notes;
    expect(notes.map((note) => note.id)).toEqual([first.id, second.id]);

    await deleteAdminUserNote({ adminId, request }, userPublicId, first.id);
    notes = (await getUserOverviewTab(userId)).notes;
    expect(notes.map((note) => note.id)).toEqual([second.id]);
  });

  it("soft-deletes and restores, and records everything in the audit trail", async () => {
    await prisma.userSession.create({
      data: {
        expiresAt: new Date(Date.now() + 86_400_000),
        publicId: createPublicId(),
        tokenHash: "b".repeat(64),
        userId,
      },
    });
    await deleteAdminUser({ adminId, request }, userPublicId, "درخواست کاربر از پشتیبانی");
    const deleted = (await getAdminUserHeader(userPublicId))!.header;
    expect(deleted.status).toBe("deleted");
    expect(deleted.counters.activeSessions).toBe(0);

    await expect(
      moderateAdminUser({ adminId, request }, userPublicId, { action: "warning", reason: "روی حساب حذف‌شده" }),
    ).rejects.toMatchObject({ status: 409 });

    await restoreAdminUser({ adminId, request }, userPublicId);
    expect((await getAdminUserHeader(userPublicId))!.header.status).toBe("active");

    const history = await getUserHistoryTab(userId);
    const actions = history.audits.map((log) => log.action);
    expect(actions).toEqual(expect.arrayContaining(["users.moderation", "users.delete", "users.restore", "users.note.create"]));
    expect(history.moderation.length).toBeGreaterThanOrEqual(5);
  });

  it("revokes a single session by its public id", async () => {
    const session = await prisma.userSession.create({
      data: {
        expiresAt: new Date(Date.now() + 86_400_000),
        publicId: createPublicId(),
        tokenHash: "c".repeat(64),
        userId,
      },
    });
    await expect(revokeAdminUserSessions({ adminId, request }, userPublicId, session.publicId!)).resolves.toEqual({ revoked: 1 });
    await expect(revokeAdminUserSessions({ adminId, request }, userPublicId, session.publicId!)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("builds a dashboard with a 30-day series", async () => {
    const overview = await getDashboardOverview();
    expect(overview.series).toHaveLength(30);
    expect(overview.users.total).toBeGreaterThanOrEqual(2);
    expect(Object.keys(overview.requests.byStatus)).toHaveLength(5);
  });
});
