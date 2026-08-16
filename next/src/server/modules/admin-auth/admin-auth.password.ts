import { ADMIN_PASSWORD_POLICY } from "@/server/contracts";
import { API_ERROR_CODES, ApiError } from "@/server/errors";

const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "password1234",
  "123456789012",
  "qwerty123456",
  "admin1234567",
  "changeme1234",
  "welcome12345",
  "letmein12345",
  "keshavarz123",
  "کشاورز123456",
]);

export function assertAdminPasswordPolicy(
  password: string,
  identity: { name?: string | null; phone?: string | null },
): void {
  if (
    password.length < ADMIN_PASSWORD_POLICY.minLength ||
    password.length > ADMIN_PASSWORD_POLICY.maxLength
  ) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      `رمز عبور باید بین ${ADMIN_PASSWORD_POLICY.minLength} و ${ADMIN_PASSWORD_POLICY.maxLength} کاراکتر باشد.`,
    );
  }

  const normalized = password.toLowerCase();
  if (COMMON_PASSWORDS.has(normalized)) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "رمز عبور بیش از حد رایج یا ضعیف است.",
    );
  }

  const phoneDigits = identity.phone?.replace(/\D/g, "") ?? "";
  if (phoneDigits.length >= 6 && normalized.includes(phoneDigits)) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "رمز عبور نباید شامل شماره موبایل باشد.",
    );
  }

  if (phoneDigits.length >= 10) {
    const local = phoneDigits.slice(-10);
    if (normalized.includes(local) || normalized.includes(local.slice(1))) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "رمز عبور نباید شامل شماره موبایل باشد.",
      );
    }
  }

  const nameParts = (identity.name ?? "")
    .toLowerCase()
    .split(/[\s._-]+/)
    .filter((part) => part.length >= 3);

  for (const part of nameParts) {
    if (normalized.includes(part)) {
      throw new ApiError(
        400,
        API_ERROR_CODES.validationFailed,
        "رمز عبور نباید شامل نام کاربر باشد.",
      );
    }
  }
}

export function nextAdminLockoutSeconds(failedLoginAttempts: number): number {
  if (failedLoginAttempts < ADMIN_PASSWORD_POLICY.lockoutThreshold) {
    return 0;
  }

  const stages = Math.floor(
    failedLoginAttempts / ADMIN_PASSWORD_POLICY.lockoutThreshold,
  );
  const seconds =
    ADMIN_PASSWORD_POLICY.initialLockoutSeconds * 2 ** Math.max(0, stages - 1);

  return Math.min(seconds, ADMIN_PASSWORD_POLICY.maximumLockoutSeconds);
}
