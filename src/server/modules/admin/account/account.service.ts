import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { prisma } from "@/server/db/prisma";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import { mapAuditRows } from "@/server/modules/admin/team/audit-viewer.service";
import {
  findAdminIdByEmail,
  listAdminAssignments,
  listAdminSessions,
  listAuditForSubjectOrActor,
  revokeAdminSessions,
  updateAdminRow,
} from "@/server/modules/admin/team/team.repository";
import { hashPassword, verifyPassword } from "@/server/security";

interface Self {
  adminId: bigint;
  request?: NextRequest;
  sessionId: bigint;
}

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;

export async function getOwnAccount(self: Self) {
  const now = systemClock.now();
  const admin = await prisma.admin.findUnique({
    select: {
      createdAt: true,
      email: true,
      image: true,
      isSuperAdmin: true,
      lastLoginAt: true,
      lastLoginIp: true,
      name: true,
      passwordChangedAt: true,
      phone: true,
      publicId: true,
    },
    where: { id: self.adminId },
  });
  if (!admin) throw new ApiError(404, API_ERROR_CODES.notFound, "حساب پیدا نشد.");

  const [sessions, assignments, activity] = await Promise.all([
    listAdminSessions(self.adminId, now),
    listAdminAssignments(prisma, self.adminId),
    listAuditForSubjectOrActor({ actorId: self.adminId }, 20),
  ]);
  const current = await prisma.adminSession.findUnique({ select: { publicId: true }, where: { id: self.sessionId } });

  return {
    activity: await mapAuditRows(activity),
    profile: {
      createdAt: admin.createdAt.toISOString(),
      email: admin.email,
      id: admin.publicId,
      image: admin.image,
      isSuperAdmin: admin.isSuperAdmin === 1,
      lastLoginAt: iso(admin.lastLoginAt),
      lastLoginIp: admin.lastLoginIp,
      name: admin.name,
      passwordChangedAt: iso(admin.passwordChangedAt),
      phone: admin.phone,
    },
    roles: assignments
      .filter((row) => !row.expiresAt || row.expiresAt > now)
      .map((row) => ({ expiresAt: iso(row.expiresAt), name: row.role.name })),
    sessions: sessions.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      current: row.publicId !== null && row.publicId === current?.publicId,
      id: row.publicId,
      ipAddress: row.ipAddress,
      isActive: !row.revokedAt && row.expiresAt > now,
      lastActivityAt: row.lastActivityAt.toISOString(),
      revokedAt: iso(row.revokedAt),
      userAgent: row.userAgent,
    })),
  };
}
export type OwnAccount = Awaited<ReturnType<typeof getOwnAccount>>;

export async function updateOwnProfile(self: Self, input: { email: string | null; name: string }) {
  try {
    await runInTransaction(async (transaction) => {
      const current = await transaction.admin.findUniqueOrThrow({
        select: { email: true, name: true },
        where: { id: self.adminId },
      });
      if (input.email) {
        const owner = await findAdminIdByEmail(transaction, input.email);
        if (owner && owner.id !== self.adminId) {
          throw new ApiError(409, API_ERROR_CODES.conflict, "این ایمیل برای مدیر دیگری ثبت شده است.", {
            fields: { email: ["این ایمیل برای مدیر دیگری ثبت شده است."] },
          });
        }
      }
      await updateAdminRow(transaction, self.adminId, { email: input.email, name: input.name });
      await recordAdminAudit(
        {
          action: "account.profile",
          adminId: self.adminId,
          module: "account",
          newValues: input,
          oldValues: current,
          request: self.request,
          subject: { id: self.adminId, type: "admin" },
        },
        transaction,
      );
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw mapPrismaError(error) ?? error;
  }
}

/** Current password is required; every other session is signed out afterwards. */
export async function changeOwnPassword(self: Self, input: { currentPassword: string; newPassword: string }) {
  const admin = await prisma.admin.findUniqueOrThrow({ select: { password: true }, where: { id: self.adminId } });
  if (!(await verifyPassword(admin.password, input.currentPassword))) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "رمز عبور فعلی نادرست است.", {
      fields: { currentPassword: ["رمز عبور فعلی نادرست است."] },
    });
  }
  const hash = await hashPassword(input.newPassword);
  return runInTransaction(async (transaction) => {
    const now = systemClock.now();
    await updateAdminRow(transaction, self.adminId, { password: hash, passwordChangedAt: now });
    const revoked = await revokeAdminSessions(transaction, {
      adminId: self.adminId,
      exceptSessionId: self.sessionId,
      now,
    });
    await recordAdminAudit(
      {
        action: "account.password_change",
        adminId: self.adminId,
        metadata: { otherSessionsRevoked: revoked },
        module: "account",
        request: self.request,
        subject: { id: self.adminId, type: "admin" },
      },
      transaction,
    );
    return { revoked };
  });
}

export async function revokeOwnSessions(self: Self, input: { others?: boolean; sessionId?: string }) {
  return runInTransaction(async (transaction) => {
    const now = systemClock.now();
    if (input.sessionId) {
      const target = await transaction.adminSession.findFirst({
        select: { id: true },
        where: { adminId: self.adminId, publicId: input.sessionId },
      });
      if (!target) throw new ApiError(404, API_ERROR_CODES.notFound, "نشست پیدا نشد.");
      if (target.id === self.sessionId) {
        throw new ApiError(400, API_ERROR_CODES.validationFailed, "برای بستن همین نشست، از حساب خارج شوید.");
      }
    }
    const revoked = await revokeAdminSessions(transaction, {
      adminId: self.adminId,
      exceptSessionId: self.sessionId,
      now,
      sessionPublicId: input.sessionId,
    });
    await recordAdminAudit(
      {
        action: "account.sessions_revoke",
        adminId: self.adminId,
        metadata: { revoked, sessionId: input.sessionId ?? "others" },
        module: "account",
        request: self.request,
        subject: { id: self.adminId, type: "admin" },
      },
      transaction,
    );
    return { revoked };
  });
}
