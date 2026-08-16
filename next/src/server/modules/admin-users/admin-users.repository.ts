import type { UserModerationActionType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { runInTransaction } from "@/server/db/transaction";

const userListSelect = {
  createdAt: true,
  id: true,
  image: true,
  isActive: true,
  lastLoginAt: true,
  name: true,
  phone: true,
  publicId: true,
} as const;

const userDetailSelect = {
  ...userListSelect,
  deletedAt: true,
  locale: true,
  phoneVerifiedAt: true,
  timezone: true,
  updatedAt: true,
  providerProfile: {
    select: {
      approvedAt: true,
      isActive: true,
      isAvailable: true,
    },
  },
} as const;

export async function findUserByPublicId(publicId: string) {
  return prisma.user.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function findAdminUserDetailByPublicId(publicId: string) {
  return prisma.user.findUnique({
    where: { publicId },
    select: userDetailSelect,
  });
}

export async function listAdminUsers(input: {
  cursorId?: bigint;
  isActive?: 0 | 1;
  limit: number;
  q?: string;
}) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.q
        ? {
            OR: [
              { name: { contains: input.q } },
              { phone: { contains: input.q } },
            ],
          }
        : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: userListSelect,
  });
}

export async function updateAdminUser(
  userId: bigint,
  data: {
    locale?: string;
    name?: string;
    timezone?: string;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: userDetailSelect,
  });
}

export async function applyUserModerationAction(input: {
  action: UserModerationActionType;
  adminId: bigint;
  endsAt?: Date | null;
  isActive?: 0 | 1;
  now: Date;
  reason: string;
  revokeSessions: boolean;
  userId: bigint;
}) {
  return runInTransaction(async (transaction) => {
    const moderation = await transaction.userModerationAction.create({
      data: {
        action: input.action,
        adminId: input.adminId,
        endsAt: input.endsAt ?? null,
        reason: input.reason,
        startsAt: input.now,
        userId: input.userId,
      },
      select: {
        action: true,
        admin: { select: { publicId: true } },
        createdAt: true,
        endsAt: true,
        id: true,
        reason: true,
        startsAt: true,
      },
    });

    if (input.isActive !== undefined) {
      await transaction.user.update({
        where: { id: input.userId },
        data: { isActive: input.isActive },
      });
    }

    if (input.revokeSessions) {
      await transaction.userSession.updateMany({
        where: {
          revokedAt: null,
          userId: input.userId,
        },
        data: {
          revokedAt: input.now,
        },
      });
    }

    return moderation;
  });
}

export async function findModerationActionById(id: bigint) {
  return prisma.userModerationAction.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function listUserModerationActions(input: {
  cursorId?: bigint;
  limit: number;
  userId: bigint;
}) {
  return prisma.userModerationAction.findMany({
    where: {
      userId: input.userId,
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      action: true,
      admin: { select: { publicId: true } },
      createdAt: true,
      endsAt: true,
      id: true,
      reason: true,
      startsAt: true,
    },
  });
}
