import type { Prisma } from "@/generated/prisma/client";

import type { Clock } from "@/server/clock/clock";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";

export interface LockedOtp {
  attemptsCount: number;
  codeHash: string;
  expiresAt: Date;
  id: bigint;
  maxAttempts: number;
}

export async function createLoginOtp(input: {
  codeHash: string;
  expiresAt: Date;
  maxAttempts: number;
  phone: string;
  requestedIp: string | null;
}): Promise<bigint> {
  return prisma.$transaction(async (transaction) => {
    await transaction.userOtpCode.updateMany({
      where: { phone: input.phone, purpose: "login", consumedAt: null },
      data: { consumedAt: new Date() },
    });
    const otp = await transaction.userOtpCode.create({
      data: {
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        maxAttempts: input.maxAttempts,
        phone: input.phone,
        purpose: "login",
        requestedIp: input.requestedIp,
      },
      select: { id: true },
    });
    return otp.id;
  });
}

export async function consumeOtpRecord(id: bigint): Promise<void> {
  await prisma.userOtpCode.updateMany({
    where: { id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export async function findLatestOtpCreatedAt(
  phone: string,
): Promise<Date | null> {
  const otp = await prisma.userOtpCode.findFirst({
    where: { phone, purpose: "login" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return otp?.createdAt ?? null;
}

export async function lockLatestLoginOtp(
  transaction: TransactionClient,
  phone: string,
): Promise<LockedOtp | null> {
  const rows = await transaction.$queryRaw<LockedOtp[]>`
    SELECT id,
           code_hash AS codeHash,
           attempts_count AS attemptsCount,
           max_attempts AS maxAttempts,
           expires_at AS expiresAt
    FROM user_otp_codes
    WHERE phone = ${phone}
      AND purpose = 'login'
      AND consumed_at IS NULL
    ORDER BY id DESC
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function findUserForLogin(
  transaction: TransactionClient,
  phone: string,
  now: Date,
) {
  return transaction.user.findUnique({
    where: { phone },
    select: {
      deletedAt: true,
      id: true,
      isActive: true,
      publicId: true,
      userModerationActions: {
        where: {
          action: { in: ["ban", "suspend"] },
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function createOrUpdateLoginUser(
  transaction: TransactionClient,
  input: {
    existingUserId?: bigint;
    ipAddress: string | null;
    now: Date;
    phone: string;
    publicId: string;
  },
) {
  if (input.existingUserId) {
    return transaction.user.update({
      where: { id: input.existingUserId },
      data: {
        lastLoginAt: input.now,
        lastLoginIp: input.ipAddress,
        phoneVerifiedAt: input.now,
      },
      select: { id: true, publicId: true },
    });
  }

  return transaction.user.create({
    data: {
      lastLoginAt: input.now,
      lastLoginIp: input.ipAddress,
      phone: input.phone,
      phoneVerifiedAt: input.now,
      publicId: input.publicId,
    },
    select: { id: true, publicId: true },
  });
}

export async function createUserSession(
  transaction: TransactionClient,
  input: {
    deviceId?: string;
    deviceName?: string;
    expiresAt: Date;
    ipAddress: string | null;
    platform: "web" | "pwa" | "android" | "ios" | "unknown";
    publicId: string;
    tokenHash: string;
    userAgent: string | null;
    userId: bigint;
  },
) {
  return transaction.userSession.create({
    data: input,
    select: { id: true, publicId: true },
  });
}

export async function incrementOtpAttempts(
  transaction: TransactionClient,
  otp: LockedOtp,
): Promise<void> {
  await transaction.userOtpCode.update({
    where: { id: otp.id },
    data: { attemptsCount: { increment: 1 } },
  });
}

export async function consumeLockedOtp(
  transaction: TransactionClient,
  otpId: bigint,
  now: Date,
): Promise<void> {
  await transaction.userOtpCode.update({
    where: { id: otpId },
    data: { consumedAt: now },
  });
}

export async function consumeAllLoginOtpsForPhone(
  transaction: TransactionClient,
  phone: string,
  now: Date,
): Promise<void> {
  await transaction.userOtpCode.updateMany({
    where: { phone, purpose: "login", consumedAt: null },
    data: { consumedAt: now },
  });
}

export interface LockedUserSession {
  deviceId: string | null;
  deviceName: string | null;
  expiresAt: Date;
  id: bigint;
  platform: "web" | "pwa" | "android" | "ios" | "unknown";
  revokedAt: Date | null;
  userId: bigint;
}

export async function lockUserSessionForRotation(
  transaction: TransactionClient,
  sessionId: bigint,
): Promise<LockedUserSession | null> {
  const rows = await transaction.$queryRaw<LockedUserSession[]>`
    SELECT id,
           user_id AS userId,
           device_id AS deviceId,
           device_name AS deviceName,
           platform,
           expires_at AS expiresAt,
           revoked_at AS revokedAt
    FROM user_sessions
    WHERE id = ${sessionId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function hasRotatedSessionSuccessor(
  transaction: TransactionClient,
  input: {
    deviceId: string | null;
    sessionId: bigint;
    userId: bigint;
  },
): Promise<boolean> {
  const count = await transaction.userSession.count({
    where: {
      id: { not: input.sessionId },
      revokedAt: null,
      userId: input.userId,
      ...(input.deviceId ? { deviceId: input.deviceId } : {}),
    },
  });
  return count > 0;
}

export async function revokeSessionFamily(
  transaction: TransactionClient,
  input: {
    deviceId: string | null;
    now: Date;
    userId: bigint;
  },
): Promise<number> {
  const result = await transaction.userSession.updateMany({
    where: input.deviceId
      ? {
          deviceId: input.deviceId,
          revokedAt: null,
          userId: input.userId,
        }
      : {
          revokedAt: null,
          userId: input.userId,
        },
    data: { revokedAt: input.now },
  });
  return result.count;
}

export async function revokeSession(
  sessionId: bigint,
  userId: bigint,
  now: Date,
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count;
}

export async function revokeAllSessions(
  userId: bigint,
  now: Date,
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
  return result.count;
}

export async function listUserSessions(userId: bigint) {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
    select: {
      createdAt: true,
      deviceName: true,
      expiresAt: true,
      id: true,
      ipAddress: true,
      lastActivityAt: true,
      platform: true,
      publicId: true,
      revokedAt: true,
    },
  });
}

export async function assignSessionPublicId(
  id: bigint,
  publicId: string,
): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id, publicId: null },
    data: { publicId },
  });
}

export async function revokeSessionByPublicId(
  publicId: string,
  userId: bigint,
  currentSessionId: bigint,
  now: Date,
): Promise<number> {
  const result = await prisma.userSession.updateMany({
    where: {
      id: { not: currentSessionId },
      publicId,
      revokedAt: null,
      userId,
    },
    data: { revokedAt: now },
  });
  return result.count;
}

export async function touchUserSession(
  sessionId: bigint,
  now: Date,
): Promise<void> {
  await prisma.userSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { lastActivityAt: now },
  });
}

export async function cleanupExpiredAppAuth(
  clock: Clock,
): Promise<{ otps: number; sessions: number }> {
  const now = clock.now();
  const otpCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sessionCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [otps, sessions] = await prisma.$transaction([
    prisma.userOtpCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: otpCutoff } },
          { consumedAt: { lt: otpCutoff } },
        ],
      },
    }),
    prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: sessionCutoff } },
          { revokedAt: { lt: sessionCutoff } },
        ],
      },
    }),
  ]);
  return { otps: otps.count, sessions: sessions.count };
}

export type UserSessionPlatform = Prisma.UserSessionCreateInput["platform"];
