import type { Clock } from "@/server/clock/clock";
import {
  ADMIN_SESSION_POLICY,
  APP_SESSION_POLICY,
} from "@/server/contracts";
import { prisma } from "@/server/db/prisma";

interface SessionLookup {
  actorId: bigint;
  actorPublicId: string;
  sessionId: bigint;
}

export interface UserSessionLookup extends SessionLookup {
  deviceId: string | null;
  reused: boolean;
  revokedAt: Date | null;
}

function isIdleExpired(
  lastActivityAt: Date,
  idleTimeoutSeconds: number,
  clock: Clock,
): boolean {
  return (
    clock.now().getTime() - lastActivityAt.getTime() >
    idleTimeoutSeconds * 1000
  );
}

export async function findUserSessionByTokenHash(
  tokenHash: string,
  clock: Clock,
): Promise<UserSessionLookup | null> {
  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    select: {
      deviceId: true,
      expiresAt: true,
      id: true,
      lastActivityAt: true,
      revokedAt: true,
      user: {
        select: {
          deletedAt: true,
          id: true,
          isActive: true,
          publicId: true,
          userModerationActions: {
            where: {
              action: { in: ["ban", "suspend"] },
              startsAt: { lte: clock.now() },
              OR: [{ endsAt: null }, { endsAt: { gt: clock.now() } }],
            },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return {
      actorId: session.user.id,
      actorPublicId: session.user.publicId,
      deviceId: session.deviceId,
      reused: true,
      revokedAt: session.revokedAt,
      sessionId: session.id,
    };
  }

  if (
    session.expiresAt <= clock.now() ||
    isIdleExpired(
      session.lastActivityAt,
      APP_SESSION_POLICY.idleTimeoutSeconds,
      clock,
    ) ||
    session.user.isActive !== 1 ||
    session.user.deletedAt ||
    session.user.userModerationActions.length > 0
  ) {
    return null;
  }

  return {
    actorId: session.user.id,
    actorPublicId: session.user.publicId,
    deviceId: session.deviceId,
    reused: false,
    revokedAt: null,
    sessionId: session.id,
  };
}

export async function findActiveUserSession(
  tokenHash: string,
  clock: Clock,
): Promise<SessionLookup | null> {
  const session = await findUserSessionByTokenHash(tokenHash, clock);
  if (!session || session.reused) {
    return null;
  }

  return {
    actorId: session.actorId,
    actorPublicId: session.actorPublicId,
    sessionId: session.sessionId,
  };
}

export async function findActiveAdminSession(
  tokenHash: string,
  clock: Clock,
): Promise<(SessionLookup & { isSuperAdmin: boolean }) | null> {
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      lastActivityAt: true,
      revokedAt: true,
      admin: {
        select: {
          deletedAt: true,
          id: true,
          isActive: true,
          isSuperAdmin: true,
          publicId: true,
        },
      },
    },
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= clock.now() ||
    isIdleExpired(
      session.lastActivityAt,
      ADMIN_SESSION_POLICY.idleTimeoutSeconds,
      clock,
    ) ||
    session.admin.isActive !== 1 ||
    session.admin.deletedAt
  ) {
    return null;
  }

  return {
    actorId: session.admin.id,
    actorPublicId: session.admin.publicId,
    isSuperAdmin: session.admin.isSuperAdmin === 1,
    sessionId: session.id,
  };
}
