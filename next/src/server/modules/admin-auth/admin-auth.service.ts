import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import {
  ADMIN_PASSWORD_POLICY,
  ADMIN_SESSION_POLICY,
} from "@/server/contracts";
import { getSecurityEnvironment } from "@/server/config/env";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  getClientIp,
  getDeviceFingerprint,
  getUserAgent,
} from "@/server/http";
import {
  assertAdminPasswordPolicy,
  nextAdminLockoutSeconds,
} from "@/server/modules/admin-auth/admin-auth.password";
import {
  createAdminSession,
  findAdminByPhoneForLogin,
  getAdminPasswordMaterial,
  getCurrentAdminProfile,
  lockAdminForAuth,
  lockAdminSessionForRotation,
  registerFailedAdminLogin,
  registerSuccessfulAdminLogin,
  revokeAllAdminSessions,
  revokeAdminSession,
  updateAdminPassword,
  updateCurrentAdminProfile,
} from "@/server/modules/admin-auth/admin-auth.repository";
import { writeAdminAuditLog } from "@/server/modules/admin-audit/admin-audit.service";
import { invalidateAdminPermissionCache } from "@/server/modules/admin-rbac/permission-cache";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";
import {
  generateOpaqueToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "@/server/security";

const GENERIC_LOGIN_ERROR = {
  message: "شماره موبایل یا رمز عبور نادرست است.",
} as const;

let dummyPasswordHash: string | null = null;

async function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= await hashPassword(
    "invalid-admin-password-timing-placeholder",
  );
  return dummyPasswordHash;
}

function createAdminSessionExpiry(now: Date): Date {
  return new Date(
    now.getTime() + ADMIN_SESSION_POLICY.absoluteLifetimeSeconds * 1000,
  );
}

function isWithinAdminRefreshWindow(expiresAt: Date, now: Date): boolean {
  return (
    expiresAt.getTime() - now.getTime() <=
    ADMIN_SESSION_POLICY.refreshWindowSeconds * 1000
  );
}

function throwGenericLoginFailure(): never {
  throw new ApiError(
    401,
    API_ERROR_CODES.authRequired,
    GENERIC_LOGIN_ERROR.message,
  );
}

export async function loginAdmin(
  input: { password: string; phone: string },
  request: NextRequest,
) {
  const ipAddress = getClientIp(request) ?? "unknown";
  const deviceFingerprint = getDeviceFingerprint(request);
  const limiter = getAppRateLimiter();

  await Promise.all([
    limiter.consume(`admin-login:phone:${input.phone}`, {
      limit: 10,
      windowMilliseconds: ADMIN_PASSWORD_POLICY.attemptWindowSeconds * 1000,
    }),
    limiter.consume(`admin-login:ip:${ipAddress}`, {
      limit: 30,
      windowMilliseconds: ADMIN_PASSWORD_POLICY.attemptWindowSeconds * 1000,
    }),
    limiter.consume(`admin-login:device:${deviceFingerprint}`, {
      limit: 20,
      windowMilliseconds: ADMIN_PASSWORD_POLICY.attemptWindowSeconds * 1000,
    }),
  ]);

  const environment = getSecurityEnvironment();
  const now = systemClock.now();
  const loginIp = getClientIp(request);
  const userAgent = getUserAgent(request);

  const result = await runInTransaction(async (transaction) => {
    const existing = await findAdminByPhoneForLogin(transaction, input.phone);
    const admin = existing
      ? await lockAdminForAuth(transaction, existing.id)
      : null;

    const passwordHash = admin?.password ?? (await getDummyPasswordHash());
    const passwordMatches = await verifyPassword(passwordHash, input.password);

    if (
      !admin ||
      admin.isActive !== 1 ||
      (admin.lockedUntil && admin.lockedUntil > now) ||
      !passwordMatches
    ) {
      if (admin && admin.isActive === 1) {
        const stillLocked = Boolean(admin.lockedUntil && admin.lockedUntil > now);
        if (!stillLocked) {
          const failedLoginAttempts = admin.failedLoginAttempts + 1;
          const lockoutSeconds = nextAdminLockoutSeconds(failedLoginAttempts);
          await registerFailedAdminLogin(transaction, {
            adminId: admin.id,
            failedLoginAttempts,
            lockedUntil:
              lockoutSeconds > 0
                ? new Date(now.getTime() + lockoutSeconds * 1000)
                : admin.lockedUntil && admin.lockedUntil > now
                  ? admin.lockedUntil
                  : null,
          });
        }
      }
      return { kind: "invalid" as const };
    }

    await registerSuccessfulAdminLogin(transaction, {
      adminId: admin.id,
      ipAddress: loginIp,
      now,
    });

    const sessionToken = generateOpaqueToken();
    const csrfToken = generateOpaqueToken();
    const expiresAt = createAdminSessionExpiry(now);

    await createAdminSession(transaction, {
      adminId: admin.id,
      expiresAt,
      ipAddress: loginIp,
      tokenHash: hashToken(sessionToken, environment.TOKEN_HASH_SECRET),
      userAgent,
    });

    return {
      adminId: admin.publicId,
      csrfToken,
      expiresAt,
      kind: "success" as const,
      sessionToken,
    };
  });

  if (result.kind === "invalid") {
    throwGenericLoginFailure();
  }

  return result;
}

export async function rotateAdminSession(input: {
  currentSessionId: bigint;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const environment = getSecurityEnvironment();
  const now = systemClock.now();

  return runInTransaction(async (transaction) => {
    const current = await lockAdminSessionForRotation(
      transaction,
      input.currentSessionId,
    );
    if (!current) {
      throw new ApiError(
        401,
        API_ERROR_CODES.invalidSession,
        "نشست معتبر نیست.",
      );
    }

    if (current.revokedAt) {
      await transaction.adminSession.updateMany({
        where: { adminId: current.adminId, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new ApiError(
        401,
        API_ERROR_CODES.invalidSession,
        "نشست معتبر نیست.",
      );
    }

    if (current.expiresAt <= now) {
      throw new ApiError(
        401,
        API_ERROR_CODES.invalidSession,
        "نشست منقضی شده است.",
      );
    }

    if (!isWithinAdminRefreshWindow(current.expiresAt, now)) {
      throw new ApiError(
        401,
        API_ERROR_CODES.invalidSession,
        "تمدید نشست هنوز در بازه مجاز نیست.",
      );
    }

    await transaction.adminSession.update({
      where: { id: input.currentSessionId },
      data: { revokedAt: now },
    });

    const sessionToken = generateOpaqueToken();
    const csrfToken = generateOpaqueToken();
    const expiresAt = createAdminSessionExpiry(now);

    await createAdminSession(transaction, {
      adminId: current.adminId,
      expiresAt,
      ipAddress: input.ipAddress,
      tokenHash: hashToken(sessionToken, environment.TOKEN_HASH_SECRET),
      userAgent: input.userAgent,
    });

    return { csrfToken, expiresAt, sessionToken };
  });
}

export async function logoutCurrentAdminSession(
  adminId: bigint,
  sessionId: bigint,
): Promise<void> {
  await revokeAdminSession(sessionId, adminId, systemClock.now());
}

export async function logoutAllAdminSessions(adminId: bigint): Promise<number> {
  return revokeAllAdminSessions(adminId, systemClock.now());
}

export async function requireCurrentAdminProfile(adminId: bigint) {
  const profile = await getCurrentAdminProfile(adminId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر یافت نشد.");
  }
  return profile;
}

export async function patchCurrentAdminProfile(
  adminId: bigint,
  data: { email?: string | null; name?: string },
) {
  return updateCurrentAdminProfile(adminId, data);
}

export async function changeCurrentAdminPassword(
  input: {
    adminId: bigint;
    currentPassword: string;
    currentSessionId: bigint;
    newPassword: string;
  },
  request: NextRequest,
): Promise<void> {
  const material = await getAdminPasswordMaterial(input.adminId);
  if (!material) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "مدیر یافت نشد.");
  }

  const matches = await verifyPassword(material.password, input.currentPassword);
  if (!matches) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "رمز عبور فعلی نادرست است.",
    );
  }

  assertAdminPasswordPolicy(input.newPassword, {
    name: material.name,
    phone: material.phone,
  });

  if (input.currentPassword === input.newPassword) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "رمز عبور جدید باید با رمز فعلی متفاوت باشد.",
    );
  }

  const passwordHash = await hashPassword(input.newPassword);
  const now = systemClock.now();

  await runInTransaction(async (transaction) => {
    await updateAdminPassword(transaction, {
      adminId: input.adminId,
      now,
      passwordHash,
    });
    await transaction.adminSession.updateMany({
      where: {
        adminId: input.adminId,
        id: { not: input.currentSessionId },
        revokedAt: null,
      },
      data: { revokedAt: now },
    });
  });

  invalidateAdminPermissionCache(input.adminId);

  await writeAdminAuditLog({
    action: "change_password",
    adminId: input.adminId,
    httpMethod: request.method,
    module: "admins",
    newValues: { passwordChanged: true },
    oldValues: { passwordChanged: false },
    request,
    route: request.nextUrl.pathname,
  });
}
