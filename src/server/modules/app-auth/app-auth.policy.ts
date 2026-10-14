import { APP_SESSION_POLICY, OTP_POLICY } from "@/server/contracts";

export function isOtpResendCooldownActive(
  latestCreatedAt: Date,
  now: Date,
  cooldownSeconds = OTP_POLICY.resendCooldownSeconds,
): boolean {
  return now.getTime() - latestCreatedAt.getTime() < cooldownSeconds * 1000;
}

export function otpResendRetryAfterSeconds(
  latestCreatedAt: Date,
  now: Date,
  cooldownSeconds = OTP_POLICY.resendCooldownSeconds,
): number {
  return Math.max(
    1,
    Math.ceil(
      (latestCreatedAt.getTime() + cooldownSeconds * 1000 - now.getTime()) /
        1000,
    ),
  );
}

export function isSessionWithinRefreshWindow(
  expiresAt: Date,
  now: Date,
  refreshWindowSeconds = APP_SESSION_POLICY.refreshWindowSeconds,
): boolean {
  return expiresAt.getTime() - now.getTime() <= refreshWindowSeconds * 1000;
}
