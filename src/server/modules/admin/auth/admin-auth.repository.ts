import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";

export async function findAdminForLogin(
  transaction: TransactionClient,
  phone: string,
) {
  const rows = await transaction.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM admins WHERE phone = ${phone} AND deleted_at IS NULL LIMIT 1 FOR UPDATE
  `;
  const id = rows[0]?.id;
  if (id === undefined) return null;

  return transaction.admin.findUnique({
    where: { id },
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

export async function registerFailedAdminLogin(
  transaction: TransactionClient,
  input: { adminId: bigint; failedLoginAttempts: number; lockedUntil: Date | null },
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
  input: { adminId: bigint; ipAddress: string | null; now: Date },
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

export async function createAdminSessionRow(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    expiresAt: Date;
    ipAddress: string | null;
    publicId: string;
    tokenHash: string;
    userAgent: string | null;
  },
): Promise<void> {
  await transaction.adminSession.create({ data: input });
}

export async function revokeAdminSessionRow(sessionId: bigint, now: Date): Promise<void> {
  await prisma.adminSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: now },
  });
}

export async function findAdminProfile(adminId: bigint) {
  return prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      email: true,
      image: true,
      isSuperAdmin: true,
      lastLoginAt: true,
      name: true,
      phone: true,
      publicId: true,
      roleAssignments: {
        where: { role: { deletedAt: null, isActive: 1 } },
        select: { role: { select: { name: true } } },
      },
    },
  });
}
