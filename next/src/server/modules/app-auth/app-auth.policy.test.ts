import { describe, expect, it } from "vitest";

import { APP_SESSION_POLICY, OTP_POLICY } from "@/server/contracts";
import {
  isOtpResendCooldownActive,
  isSessionWithinRefreshWindow,
  otpResendRetryAfterSeconds,
} from "@/server/modules/app-auth/app-auth.policy";

describe("app auth policy helpers", () => {
  it("detects active OTP resend cooldown", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");
    const latest = new Date(now.getTime() - 15_000);

    expect(isOtpResendCooldownActive(latest, now)).toBe(true);
    expect(otpResendRetryAfterSeconds(latest, now)).toBe(
      OTP_POLICY.resendCooldownSeconds - 15,
    );
  });

  it("allows OTP resend after cooldown", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");
    const latest = new Date(
      now.getTime() - OTP_POLICY.resendCooldownSeconds * 1000,
    );

    expect(isOtpResendCooldownActive(latest, now)).toBe(false);
  });

  it("allows refresh only inside the final refresh window", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");
    const insideWindow = new Date(
      now.getTime() + APP_SESSION_POLICY.refreshWindowSeconds * 1000,
    );
    const outsideWindow = new Date(
      now.getTime() +
        APP_SESSION_POLICY.refreshWindowSeconds * 1000 +
        60_000,
    );

    expect(isSessionWithinRefreshWindow(insideWindow, now)).toBe(true);
    expect(isSessionWithinRefreshWindow(outsideWindow, now)).toBe(false);
  });
});
