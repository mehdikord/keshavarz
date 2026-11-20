import type { NextRequest } from "next/server";

import type { AdminAccess } from "@/lib/admin/permissions";
import { systemClock } from "@/server/clock/clock";
import { getSecurityEnvironment } from "@/server/config/env";
import { ADMIN_PASSWORD_POLICY, ADMIN_SESSION_POLICY } from "@/server/contracts";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { getClientIp, getDeviceFingerprint, getUserAgent } from "@/server/http";
import { createPublicId } from "@/server/identifiers/ulid";
import { resolveAdminAccess } from "@/server/modules/admin/access/admin-access.service";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  createAdminSessionRow,
  findAdminForLogin,
  findAdminProfile,
  registerFailedAdminLogin,
  registerSuccessfulAdminLogin,
  revokeAdminSessionRow,
} from "@/server/modules/admin/auth/admin-auth.repository";
import type { AdminLoginInput } from "@/server/modules/admin/auth/admin-auth.schemas";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";
import { generateOpaqueToken, hashPassword, hashToken, verifyPassword } from "@/server/security";

const INVALID_CREDENTIALS = "شماره موبایل یا رمز عبور نادرست است.";

let timingPlaceholderHash: Promise<string> | null = null;

/** Verifying against a real hash keeps unknown phones as slow as known ones. */
function getTimingPlaceholderHash(): Promise<string> {
  timingPlaceholderHash ??= hashPassword("keshavarz-admin-timing-placeholder");
  return timingPlaceholderHash;
}

/**
 * Lockout grows with consecutive failures: none below the threshold, then the
 * initial lockout doubling on each further failure, capped at the maximum.
 */
export function lockoutSecondsFor(failedAttempts: number): number {
  const over = failedAttempts - ADMIN_PASSWORD_POLICY.lockoutThreshold;
  if (over < 0) return 0;
  return Math.min(
    ADMIN_PASSWORD_POLICY.initialLockoutSeconds * 2 ** over,
    ADMIN_PASSWORD_POLICY.maximumLockoutSeconds,
  );
}

export interface AdminLoginResult {
  adminId: string;
  csrfToken: string;
  expiresAt: Date;
  sessionToken: string;
}

export async function loginAdmin(
  input: AdminLoginInput,
  request: NextRequest,
): Promise<AdminLoginResult> {
  const ipAddress = getClientIp(request);
  const windowMilliseconds = ADMIN_PASSWORD_POLICY.attemptWindowSeconds * 1000;
  const limiter = getAppRateLimiter();

  await Promise.all([
    limiter.consume(`admin-login:phone:${input.phone}`, { limit: 10, windowMilliseconds }),
    limiter.consume(`admin-login:ip:${ipAddress ?? "unknown"}`, { limit: 30, windowMilliseconds }),
    limiter.consume(`admin-login:device:${getDeviceFingerprint(request)}`, {
      limit: 20,
      windowMilliseconds,
    }),
  ]);

  const now = systemClock.now();
  const placeholder = await getTimingPlaceholderHash();

  const outcome = await runInTransaction(async (transaction) => {
    const admin = await findAdminForLogin(transaction, input.phone);
    const passwordMatches = await verifyPassword(admin?.password ?? placeholder, input.password);

    if (!admin || admin.isActive !== 1) {
      return { kind: "invalid" as const };
    }

    if (admin.lockedUntil && admin.lockedUntil > now) {
      return { kind: "locked" as const, until: admin.lockedUntil };
    }

    if (!passwordMatches) {
      const failedLoginAttempts = admin.failedLoginAttempts + 1;
      const lockoutSeconds = lockoutSecondsFor(failedLoginAttempts);
      const lockedUntil = lockoutSeconds > 0 ? new Date(now.getTime() + lockoutSeconds * 1000) : null;
      await registerFailedAdminLogin(transaction, {
        adminId: admin.id,
        failedLoginAttempts,
        lockedUntil,
      });
      return lockedUntil
        ? { adminId: admin.id, kind: "locked-now" as const, until: lockedUntil }
        : { kind: "invalid" as const };
    }

    await registerSuccessfulAdminLogin(transaction, { adminId: admin.id, ipAddress, now });

    const sessionToken = generateOpaqueToken();
    const expiresAt = new Date(now.getTime() + ADMIN_SESSION_POLICY.absoluteLifetimeSeconds * 1000);

    await createAdminSessionRow(transaction, {
      adminId: admin.id,
      expiresAt,
      ipAddress,
      publicId: createPublicId(now.getTime()),
      tokenHash: hashToken(sessionToken, getSecurityEnvironment().TOKEN_HASH_SECRET),
      userAgent: getUserAgent(request),
    });

    await recordAdminAudit(
      { action: "auth.login", adminId: admin.id, module: "auth", request },
      transaction,
    );

    return {
      adminId: admin.publicId,
      csrfToken: generateOpaqueToken(),
      expiresAt,
      kind: "success" as const,
      sessionToken,
    };
  });

  if (outcome.kind === "success") {
    return outcome;
  }

  if (outcome.kind === "locked-now") {
    await recordAdminAudit({
      action: "auth.locked",
      adminId: outcome.adminId,
      metadata: { lockedUntil: outcome.until },
      module: "auth",
      request,
    });
  }

  if (outcome.kind === "locked" || outcome.kind === "locked-now") {
    const retryAfter = Math.max(1, Math.ceil((outcome.until.getTime() - now.getTime()) / 1000));
    throw new ApiError(
      423,
      API_ERROR_CODES.accountUnavailable,
      "به‌دلیل تلاش‌های ناموفق پیاپی، ورود به این حساب موقتاً قفل شده است.",
      { headers: { "Retry-After": String(retryAfter) } },
    );
  }

  throw new ApiError(401, API_ERROR_CODES.authRequired, INVALID_CREDENTIALS);
}

export async function logoutAdmin(
  input: { adminId: bigint; sessionId: bigint },
  request: NextRequest,
): Promise<void> {
  await revokeAdminSessionRow(input.sessionId, systemClock.now());
  await recordAdminAudit({ action: "auth.logout", adminId: input.adminId, module: "auth", request });
}

export interface AdminViewer {
  access: AdminAccess;
  email: string | null;
  id: string;
  image: string | null;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  name: string;
  phone: string;
  roles: string[];
}

export async function getAdminViewer(adminId: bigint): Promise<AdminViewer | null> {
  const [profile, access] = await Promise.all([findAdminProfile(adminId), resolveAdminAccess(adminId)]);

  if (!profile) {
    return null;
  }

  return {
    access,
    email: profile.email,
    id: profile.publicId,
    image: profile.image,
    isSuperAdmin: profile.isSuperAdmin === 1,
    lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
    name: profile.name,
    phone: profile.phone,
    roles: profile.roleAssignments.map((assignment) => assignment.role.name),
  };
}
