import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

export async function findAdminByPhoneForLogin(
  transaction: TransactionClient,
  phone: string,
) {
  return transaction.admin.findFirst({
    where: { phone, deletedAt: null },
    select: {
      failedLoginAttempts: true,
      id: true,
      isActive: true,
      lockedUntil: true,
      name: true,
      password: true,
      publicId: true,
    },
  });
}

export async function lockAdminForAuth(
  transaction: TransactionClient,
  adminId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      failedLoginAttempts: number;
      id: bigint;
      isActive: number;
      lockedUntil: Date | null;
      password: string;
      publicId: string;
    }>
  >`
    SELECT id,
           public_id AS publicId,
           password,
           is_active AS isActive,
           failed_login_attempts AS failedLoginAttempts,
           locked_until AS lockedUntil
    FROM admins
    WHERE id = ${adminId}
      AND deleted_at IS NULL
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function registerFailedAdminLogin(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
  },
): Promise<void> {
  await transaction.admin.update({
    where: { id: input.adminId },
    data: {
      failedLoginAttempts: input.failedLoginAttempts,
      lockedUntil: input.lockedUntil,
    },
  });
}

export async function registerSuccessfulAdminLogin(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    ipAddress: string | null;
    now: Date;
  },
): Promise<void> {
  await transaction.admin.update({
    where: { id: input.adminId },
    data: {
      failedLoginAttempts: 0,
      lastLoginAt: input.now,
      lastLoginIp: input.ipAddress,
      lockedUntil: null,
    },
  });
}

export async function createAdminSession(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    expiresAt: Date;
    ipAddress: string | null;
    tokenHash: string;
    userAgent: string | null;
  },
) {
  return transaction.adminSession.create({
    data: input,
    select: { id: true },
  });
}

export async function lockAdminSessionForRotation(
  transaction: TransactionClient,
  sessionId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      adminId: bigint;
      expiresAt: Date;
      id: bigint;
      revokedAt: Date | null;
    }>
  >`
    SELECT id,
           admin_id AS adminId,
           expires_at AS expiresAt,
           revoked_at AS revokedAt
    FROM admin_sessions
    WHERE id = ${sessionId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function revokeAdminSession(
  sessionId: bigint,
  adminId: bigint,
  now: Date,
): Promise<number> {
  const result = await prisma.adminSession.updateMany({
    where: { id: sessionId, adminId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count;
}

export async function revokeAllAdminSessions(
  adminId: bigint,
  now: Date,
  exceptSessionId?: bigint,
): Promise<number> {
  const result = await prisma.adminSession.updateMany({
    where: {
      adminId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: now },
  });
  return result.count;
}

export async function touchAdminSession(
  sessionId: bigint,
  now: Date,
): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { lastActivityAt: now },
  });
}

export async function getCurrentAdminProfile(adminId: bigint) {
  return prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: {
      email: true,
      image: true,
      isSuperAdmin: true,
      name: true,
      phone: true,
      publicId: true,
    },
  });
}

export async function updateCurrentAdminProfile(
  adminId: bigint,
  data: { email?: string | null; name?: string },
) {
  return prisma.admin.update({
    where: { id: adminId },
    data,
    select: {
      email: true,
      image: true,
      isSuperAdmin: true,
      name: true,
      phone: true,
      publicId: true,
    },
  });
}

export async function getAdminPasswordMaterial(adminId: bigint) {
  return prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null, isActive: 1 },
    select: {
      id: true,
      name: true,
      password: true,
      phone: true,
    },
  });
}

export async function updateAdminPassword(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    now: Date;
    passwordHash: string;
  },
): Promise<void> {
  await transaction.admin.update({
    where: { id: input.adminId },
    data: {
      password: input.passwordHash,
      passwordChangedAt: input.now,
    },
  });
}

export async function countActiveSuperAdmins(
  excludeAdminId?: bigint,
): Promise<number> {
  return prisma.admin.count({
    where: {
      deletedAt: null,
      isActive: 1,
      isSuperAdmin: 1,
      ...(excludeAdminId ? { id: { not: excludeAdminId } } : {}),
    },
  });
}

export async function findAdminStatusTarget(adminId: bigint) {
  return prisma.admin.findFirst({
    where: { id: adminId, deletedAt: null },
    select: {
      id: true,
      isActive: true,
      isSuperAdmin: true,
    },
  });
}
