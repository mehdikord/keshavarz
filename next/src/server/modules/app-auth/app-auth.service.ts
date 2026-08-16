import { randomInt } from "node:crypto";

import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import {
  APP_SESSION_POLICY,
  OTP_POLICY,
  PublicIdSchema,
} from "@/server/contracts";
import { getSecurityEnvironment } from "@/server/config/env";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  getClientIp,
  getDeviceFingerprint,
  getUserAgent,
} from "@/server/http";
import { createPublicId } from "@/server/identifiers/ulid";
import type { SmsQueue } from "@/server/integrations";
import { HttpSmsQueue } from "@/server/integrations";
import {
  isOtpResendCooldownActive,
  isSessionWithinRefreshWindow,
  otpResendRetryAfterSeconds,
} from "@/server/modules/app-auth/app-auth.policy";
import {
  assignSessionPublicId,
  consumeAllLoginOtpsForPhone,
  consumeOtpRecord,
  createLoginOtp,
  createOrUpdateLoginUser,
  createUserSession,
  findLatestOtpCreatedAt,
  findUserForLogin,
  incrementOtpAttempts,
  listUserSessions,
  lockLatestLoginOtp,
  lockUserSessionForRotation,
  revokeAllSessions,
  revokeSession,
  revokeSessionByPublicId,
  revokeSessionFamily,
} from "@/server/modules/app-auth/app-auth.repository";
import { getAppRateLimiter } from "@/server/rate-limit/default-rate-limiter";
import {
  generateOpaqueToken,
  getOtpPepperSecrets,
  hashOtp,
  hashToken,
  safeEqual,
} from "@/server/security";

const GENERIC_OTP_RESPONSE = {
  message: "اگر شماره معتبر باشد، کد تأیید ارسال می‌شود.",
} as const;

function createOtpCode(): string {
  const lowerBound = 10 ** (OTP_POLICY.digits - 1);
  return String(randomInt(lowerBound, 10 ** OTP_POLICY.digits));
}

function resolveSmsQueue(): SmsQueue {
  const environment = getSecurityEnvironment();

  if (!environment.SMS_QUEUE_URL || !environment.SMS_QUEUE_TOKEN) {
    throw new Error("SMS queue is not configured.");
  }

  return new HttpSmsQueue(
    environment.SMS_QUEUE_URL,
    environment.SMS_QUEUE_TOKEN,
  );
}

function createSessionExpiry(now: Date): Date {
  return new Date(
    now.getTime() + APP_SESSION_POLICY.absoluteLifetimeSeconds * 1000,
  );
}

export async function requestLoginOtp(
  input: { phone: string },
  request: NextRequest,
  smsQueue: SmsQueue = resolveSmsQueue(),
) {
  const ipAddress = getClientIp(request) ?? "unknown";
  const deviceFingerprint = getDeviceFingerprint(request);
  const limiter = getAppRateLimiter();

  try {
    await Promise.all([
      limiter.consume(`app-otp:phone:${input.phone}`, {
        limit: OTP_POLICY.maxPhoneRequestsPerThirtyMinutes,
        windowMilliseconds: 30 * 60 * 1000,
      }),
      limiter.consume(`app-otp:ip:${ipAddress}`, {
        limit: OTP_POLICY.maxIpRequestsPerHour,
        windowMilliseconds: 60 * 60 * 1000,
      }),
      limiter.consume(`app-otp:device:${deviceFingerprint}`, {
        limit: OTP_POLICY.maxDeviceRequestsPerHour,
        windowMilliseconds: 60 * 60 * 1000,
      }),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      const { emitAlert } = await import("@/server/observability/alerts");
      emitAlert("auth_abuse", { channel: "otp_request", ipAddress });
    }
    throw error;
  }
  const now = systemClock.now();
  const latestCreatedAt = await findLatestOtpCreatedAt(input.phone);

  if (latestCreatedAt && isOtpResendCooldownActive(latestCreatedAt, now)) {
    throw new ApiError(
      429,
      API_ERROR_CODES.rateLimited,
      "ارسال مجدد کد هنوز مجاز نیست.",
      {
        headers: {
          "Retry-After": String(
            otpResendRetryAfterSeconds(latestCreatedAt, now),
          ),
        },
      },
    );
  }

  const code = createOtpCode();
  const codeHash = hashOtp(
    input.phone,
    "login",
    code,
    getSecurityEnvironment().OTP_HASH_PEPPER,
  );
  const otpId = await createLoginOtp({
    codeHash,
    expiresAt: new Date(now.getTime() + OTP_POLICY.expiresInSeconds * 1000),
    maxAttempts: OTP_POLICY.maxAttempts,
    phone: input.phone,
    requestedIp: getClientIp(request),
  });

  try {
    await smsQueue.enqueue({
      body: `کد ورود کشاورز: ${code}`,
      recipient: input.phone,
    });
  } catch (error) {
    await consumeOtpRecord(otpId);
    throw error;
  }

  return GENERIC_OTP_RESPONSE;
}

type VerifyResult =
  | { kind: "invalid" }
  | { kind: "unavailable" }
  | {
      csrfToken: string;
      expiresAt: Date;
      kind: "success";
      sessionToken: string;
      userId: string;
    };

export async function verifyLoginOtp(
  input: {
    code: string;
    deviceId?: string;
    deviceName?: string;
    phone: string;
    platform: "web" | "pwa" | "android" | "ios" | "unknown";
  },
  request: NextRequest,
): Promise<Exclude<VerifyResult, { kind: "invalid" | "unavailable" }>> {
  const ipAddress = getClientIp(request) ?? "unknown";
  const limiter = getAppRateLimiter();

  await Promise.all([
    limiter.consume(`app-otp-verify:phone:${input.phone}`, {
      limit: OTP_POLICY.maxAttempts * 2,
      windowMilliseconds: 15 * 60 * 1000,
    }),
    limiter.consume(`app-otp-verify:ip:${ipAddress}`, {
      limit: 50,
      windowMilliseconds: 15 * 60 * 1000,
    }),
  ]);

  const environment = getSecurityEnvironment();
  const now = systemClock.now();
  const loginIpAddress = getClientIp(request);
  const userAgent = getUserAgent(request);
  const result = await runInTransaction<VerifyResult>(async (transaction) => {
    const otp = await lockLatestLoginOtp(transaction, input.phone);

    if (
      !otp ||
      otp.expiresAt <= now ||
      otp.attemptsCount >= otp.maxAttempts
    ) {
      return { kind: "invalid" };
    }

    let codeMatches = false;

    for (const pepper of getOtpPepperSecrets()) {
      const submittedHash = hashOtp(
        input.phone,
        "login",
        input.code,
        pepper,
      );

      if (safeEqual(otp.codeHash, submittedHash)) {
        codeMatches = true;
        break;
      }
    }

    if (!codeMatches) {
      await incrementOtpAttempts(transaction, otp);
      return { kind: "invalid" };
    }

    const existingUser = await findUserForLogin(
      transaction,
      input.phone,
      now,
    );

    if (
      existingUser &&
      (existingUser.deletedAt ||
        existingUser.isActive !== 1 ||
        existingUser.userModerationActions.length > 0)
    ) {
      await consumeAllLoginOtpsForPhone(transaction, input.phone, now);
      return { kind: "unavailable" };
    }

    const user = await createOrUpdateLoginUser(transaction, {
      existingUserId: existingUser?.id,
      ipAddress: loginIpAddress,
      now,
      phone: input.phone,
      publicId: createPublicId(now.getTime()),
    });
    const sessionToken = generateOpaqueToken();
    const csrfToken = generateOpaqueToken();
    const expiresAt = createSessionExpiry(now);

    await createUserSession(transaction, {
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      expiresAt,
      ipAddress: loginIpAddress,
      platform: input.platform,
      publicId: createPublicId(),
      tokenHash: hashToken(sessionToken, environment.TOKEN_HASH_SECRET),
      userAgent,
      userId: user.id,
    });
    await consumeAllLoginOtpsForPhone(transaction, input.phone, now);

    return {
      csrfToken,
      expiresAt,
      kind: "success",
      sessionToken,
      userId: user.publicId,
    };
  }, { isolationLevel: "ReadCommitted" });

  if (result.kind === "invalid") {
    throw new ApiError(
      400,
      API_ERROR_CODES.invalidOtp,
      "کد تأیید معتبر نیست یا منقضی شده است.",
    );
  }
  if (result.kind === "unavailable") {
    throw new ApiError(
      403,
      API_ERROR_CODES.accountUnavailable,
      "حساب کاربری امکان ورود ندارد.",
    );
  }

  return result;
}

export async function rotateUserSession(input: {
  currentSessionId: bigint;
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const environment = getSecurityEnvironment();
  const now = systemClock.now();

  return runInTransaction(async (transaction) => {
    const current = await lockUserSessionForRotation(
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
      await revokeSessionFamily(transaction, {
        deviceId: current.deviceId,
        now,
        userId: current.userId,
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

    if (!isSessionWithinRefreshWindow(current.expiresAt, now)) {
      throw new ApiError(
        401,
        API_ERROR_CODES.invalidSession,
        "تمدید نشست هنوز در بازه مجاز نیست.",
      );
    }

    const sessionToken = generateOpaqueToken();
    const csrfToken = generateOpaqueToken();
    const expiresAt = createSessionExpiry(now);

    await transaction.userSession.update({
      where: { id: input.currentSessionId },
      data: { revokedAt: now },
    });
    await createUserSession(transaction, {
      deviceId: current.deviceId ?? undefined,
      deviceName: current.deviceName ?? undefined,
      expiresAt,
      ipAddress: input.ipAddress,
      platform: current.platform,
      publicId: createPublicId(),
      tokenHash: hashToken(sessionToken, environment.TOKEN_HASH_SECRET),
      userAgent: input.userAgent,
      userId: current.userId,
    });

    return { csrfToken, expiresAt, sessionToken };
  });
}

export async function logoutCurrentSession(
  userId: bigint,
  sessionId: bigint,
): Promise<void> {
  await revokeSession(sessionId, userId, systemClock.now());
}

export async function logoutAllUserSessions(userId: bigint): Promise<number> {
  return revokeAllSessions(userId, systemClock.now());
}

export async function getUserSessions(
  userId: bigint,
  currentSessionId: bigint,
) {
  const sessions = await listUserSessions(userId);

  for (const session of sessions) {
    if (!session.publicId) {
      await assignSessionPublicId(session.id, createPublicId());
    }
  }

  const refreshed = sessions.some((session) => !session.publicId)
    ? await listUserSessions(userId)
    : sessions;

  return refreshed.map((session) => ({
    createdAt: session.createdAt.toISOString(),
    current: session.id === currentSessionId,
    deviceName: session.deviceName,
    expiresAt: session.expiresAt.toISOString(),
    ipAddress: session.ipAddress,
    lastActivityAt: session.lastActivityAt.toISOString(),
    platform: session.platform,
    revoked: Boolean(session.revokedAt),
    sessionId: PublicIdSchema.parse(session.publicId),
  }));
}

export async function revokeOtherUserSession(input: {
  currentSessionId: bigint;
  publicSessionId: string;
  userId: bigint;
}): Promise<void> {
  const count = await revokeSessionByPublicId(
    input.publicSessionId,
    input.userId,
    input.currentSessionId,
    systemClock.now(),
  );
  if (count === 0) {
    throw new ApiError(
      404,
      API_ERROR_CODES.notFound,
      "نشست موردنظر یافت نشد.",
    );
  }
}
