import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { requireAdminSession } from "@/server/auth";
import { ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY } from "@/server/contracts";
import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import {
  loginAdmin,
  rotateAdminSession,
} from "@/server/modules/admin-auth/admin-auth.service";
import {
  invalidateAdminPermissionCache,
} from "@/server/modules/admin-rbac/permission-cache";
import {
  buildPermissionContext,
  loadAdminPermissionMaterial,
} from "@/server/modules/admin-rbac/permission-evaluator";
import { requirePermission } from "@/server/security";
import { hashPassword, hashToken } from "@/server/security";
import { getSecurityEnvironment } from "@/server/config/env";

const phones = [
  "09992000001",
  "09992000002",
  "09992000003",
  "09992000004",
  "09992000010",
  "09992000011",
];
const password = "ValidAdminPass!99";

function request(ip = "127.0.1.10") {
  return new NextRequest("http://localhost/api/admins/v1/auth/login", {
    headers: {
      origin: getSecurityEnvironment().ADMIN_ORIGIN,
      "user-agent": "vitest-admin",
      "x-device-id": "admin-device",
      "x-forwarded-for": ip,
    },
  });
}

async function createAdmin(input: {
  failedLoginAttempts?: number;
  isActive?: number;
  isSuperAdmin?: number;
  lockedUntil?: Date | null;
  phone: string;
}) {
  const passwordHash = await hashPassword(password);
  return prisma.admin.create({
    data: {
      failedLoginAttempts: input.failedLoginAttempts ?? 0,
      isActive: input.isActive ?? 1,
      isSuperAdmin: input.isSuperAdmin ?? 0,
      lockedUntil: input.lockedUntil ?? null,
      name: "مدیر تست",
      password: passwordHash,
      phone: input.phone,
      publicId: createPublicId(),
    },
  });
}

async function cleanup() {
  await prisma.adminAuditLog.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.adminPermissionOverride.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.adminRoleAssignment.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.adminSession.deleteMany({
    where: { admin: { phone: { in: phones } } },
  });
  await prisma.admin.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("admin authentication integration", () => {
  beforeAll(cleanup, 60_000);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("logs in with password and stores only token hash", async () => {
    const phone = phones[0]!;
    await createAdmin({ phone });
    const result = await loginAdmin({ password, phone }, request());
    const session = await prisma.adminSession.findFirstOrThrow({
      where: { admin: { phone } },
    });
    expect(result.adminId).toBeTruthy();
    expect(session.tokenHash).not.toBe(result.sessionToken);
    expect(session.tokenHash).toHaveLength(64);
  });

  it("uses generic errors and does not reveal admin existence", async () => {
    await expect(
      loginAdmin(
        { password: "wrong-password!!", phone: "09992000999" },
        request("127.0.1.11"),
      ),
    ).rejects.toMatchObject({ status: 401 });

    const phone = phones[1]!;
    await createAdmin({ phone });
    await expect(
      loginAdmin(
        { password: "wrong-password!!", phone },
        request("127.0.1.12"),
      ),
    ).rejects.toMatchObject({
      message: "شماره موبایل یا رمز عبور نادرست است.",
      status: 401,
    });
  });

  it("locks after repeated failed attempts and unlocks by time", async () => {
    const phone = phones[2]!;
    await createAdmin({ phone });

    for (let index = 0; index < ADMIN_PASSWORD_POLICY.lockoutThreshold; index += 1) {
      await expect(
        loginAdmin(
          { password: "wrong-password!!", phone },
          request(`127.0.1.${20 + index}`),
        ),
      ).rejects.toMatchObject({ status: 401 });
    }

    const locked = await prisma.admin.findUniqueOrThrow({ where: { phone } });
    expect(locked.lockedUntil).not.toBeNull();
    expect(locked.failedLoginAttempts).toBeGreaterThanOrEqual(
      ADMIN_PASSWORD_POLICY.lockoutThreshold,
    );

    await expect(
      loginAdmin({ password, phone }, request("127.0.1.40")),
    ).rejects.toMatchObject({ status: 401 });

    await prisma.admin.update({
      where: { phone },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const unlocked = await loginAdmin({ password, phone }, request("127.0.1.41"));
    expect(unlocked.sessionToken).toBeTruthy();
  });

  it("rejects inactive admin sessions after deactivation", async () => {
    const phone = phones[3]!;
    const admin = await createAdmin({ phone });
    const token = "admin-active-token";
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt: new Date(Date.now() + 60_000),
        tokenHash: hashToken(token, getSecurityEnvironment().TOKEN_HASH_SECRET),
      },
    });

    const ok = await requireAdminSession(
      new NextRequest("http://localhost/api/admins/v1/me", {
        headers: { cookie: `__Secure-keshavarz_admin_session=${token}` },
      }),
    );
    expect(ok.internalAdminId).toBe(admin.id);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { isActive: 0 },
    });

    await expect(
      requireAdminSession(
        new NextRequest("http://localhost/api/admins/v1/me", {
          headers: { cookie: `__Secure-keshavarz_admin_session=${token}` },
        }),
      ),
    ).rejects.toMatchObject({ code: "INVALID_SESSION", status: 401 });
  });

  it("evaluates role expiry, allow override, and deny override precedence", async () => {
    const phone = "09992000010";
    const admin = await createAdmin({ phone });
    phones.push(phone);

    const permissionView = await prisma.adminPermission.upsert({
      where: { code: "users.view" },
      update: { isActive: 1 },
      create: {
        action: "view",
        code: "users.view",
        module: "users",
        name: "users.view",
      },
    });
    const permissionUpdate = await prisma.adminPermission.upsert({
      where: { code: "users.update" },
      update: { isActive: 1 },
      create: {
        action: "update",
        code: "users.update",
        module: "users",
        name: "users.update",
      },
    });

    const role = await prisma.adminRole.create({
      data: {
        code: `role_${createPublicId().slice(0, 10)}`,
        isActive: 1,
        name: "Role Test",
      },
    });
    await prisma.adminRolePermission.create({
      data: {
        permissionId: permissionUpdate.id,
        roleId: role.id,
      },
    });
    await prisma.adminRoleAssignment.create({
      data: {
        adminId: admin.id,
        expiresAt: new Date(Date.now() - 1000),
        roleId: role.id,
      },
    });
    await prisma.adminPermissionOverride.create({
      data: {
        adminId: admin.id,
        effect: "allow",
        permissionId: permissionView.id,
      },
    });
    await prisma.adminPermissionOverride.create({
      data: {
        adminId: admin.id,
        effect: "deny",
        permissionId: permissionUpdate.id,
      },
    });

    invalidateAdminPermissionCache(admin.id);
    const material = await loadAdminPermissionMaterial(
      admin.id,
      new Date(),
    );
    const context = buildPermissionContext(material);

    expect(() => requirePermission(context, "users.view")).not.toThrow();
    expect(() => requirePermission(context, "users.update")).toThrow();
  });

  it("rotates admin session only inside refresh window", async () => {
    const phone = "09992000011";
    const admin = await createAdmin({ phone });
    phones.push(phone);

    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt: new Date(
          Date.now() + ADMIN_SESSION_POLICY.refreshWindowSeconds * 1000 - 30_000,
        ),
        tokenHash: hashToken(
          "admin-refresh-token",
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
      },
    });

    const rotated = await rotateAdminSession({
      currentSessionId: session.id,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });
    expect(rotated.sessionToken).toBeTruthy();

    const outside = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        expiresAt: new Date(
          Date.now() +
            ADMIN_SESSION_POLICY.refreshWindowSeconds * 1000 +
            60_000,
        ),
        tokenHash: hashToken(
          "admin-outside-token",
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
      },
    });

    await expect(
      rotateAdminSession({
        currentSessionId: outside.id,
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      }),
    ).rejects.toMatchObject({ code: "INVALID_SESSION", status: 401 });
  });
});
