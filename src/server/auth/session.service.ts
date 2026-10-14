import type { NextRequest } from "next/server";

import {
  findActiveAdminSession,
  findUserSessionByTokenHash,
} from "@/server/auth/session.repository";
import { systemClock } from "@/server/clock/clock";
import type { PublicId } from "@/server/contracts";
import { PublicIdSchema } from "@/server/contracts";
import { runInTransaction } from "@/server/db/transaction";
import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";
import { touchAdminSession } from "@/server/modules/admin-auth/admin-auth.repository";
import {
  hasRotatedSessionSuccessor,
  revokeSessionFamily,
  touchUserSession,
} from "@/server/modules/app-auth/app-auth.repository";
import {
  getSessionCookieName,
  getTokenHashSecrets,
  hashToken,
} from "@/server/security";

export interface UserAuthContext {
  internalUserId: bigint;
  sessionId: bigint;
  userId: PublicId;
}

export interface AdminAuthContext {
  adminId: PublicId;
  internalAdminId: bigint;
  isSuperAdmin: boolean;
  sessionId: bigint;
}

function requireSessionToken(
  request: NextRequest,
  realm: "admins" | "app",
): string {
  const token = request.cookies.get(
    getSessionCookieName(realm),
  )?.value;

  if (!token) {
    throw new ApiError(
      401,
      API_ERROR_CODES.authRequired,
      "برای ادامه باید وارد حساب شوید.",
    );
  }

  return token;
}

export async function requireUserSession(
  request: NextRequest,
): Promise<UserAuthContext> {
  const token = requireSessionToken(request, "app");
  const session = await findUserSessionForToken(token, systemClock);

  if (!session) {
    throw new ApiError(
      401,
      API_ERROR_CODES.invalidSession,
      "نشست معتبر نیست یا منقضی شده است.",
    );
  }

  if (session.reused) {
    if (session.deviceId) {
      await runInTransaction(async (transaction) => {
        const rotated = await hasRotatedSessionSuccessor(transaction, {
          deviceId: session.deviceId,
          sessionId: session.sessionId,
          userId: session.actorId,
        });
        if (rotated) {
          await revokeSessionFamily(transaction, {
            deviceId: session.deviceId,
            now: systemClock.now(),
            userId: session.actorId,
          });
        }
      });
    }
    throw new ApiError(
      401,
      API_ERROR_CODES.invalidSession,
      "نشست معتبر نیست یا منقضی شده است.",
    );
  }

  await touchUserSession(session.sessionId, systemClock.now());

  return {
    internalUserId: session.actorId,
    sessionId: session.sessionId,
    userId: PublicIdSchema.parse(session.actorPublicId),
  };
}

export async function requireAdminSession(
  request: NextRequest,
): Promise<AdminAuthContext> {
  const token = requireSessionToken(request, "admins");
  const session = await findActiveAdminSessionForToken(token, systemClock);

  if (!session) {
    throw new ApiError(
      401,
      API_ERROR_CODES.invalidSession,
      "نشست معتبر نیست یا منقضی شده است.",
    );
  }

  await touchAdminSession(session.sessionId, systemClock.now());

  return {
    adminId: PublicIdSchema.parse(session.actorPublicId),
    internalAdminId: session.actorId,
    isSuperAdmin: session.isSuperAdmin,
    sessionId: session.sessionId,
  };
}

async function findUserSessionForToken(
  token: string,
  now: Date,
) {
  const secrets = getTokenHashSecrets();

  for (const secret of secrets) {
    const session = await findUserSessionByTokenHash(
      hashToken(token, secret),
      now,
    );
    if (session) {
      return session;
    }
  }

  return null;
}

async function findActiveAdminSessionForToken(
  token: string,
  now: Date,
) {
  const secrets = getTokenHashSecrets();

  for (const secret of secrets) {
    const session = await findActiveAdminSession(
      hashToken(token, secret),
      now,
    );
    if (session) {
      return session;
    }
  }

  return null;
}
