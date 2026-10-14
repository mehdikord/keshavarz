import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import * as argon2 from "argon2";

import { getSecurityEnvironment } from "@/server/config/env";
import { ADMIN_PASSWORD_POLICY } from "@/server/contracts";

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

/** secrets فعال و قبلی برای چرخش (rotation) — اولی primary است. */
export function getTokenHashSecrets(): string[] {
  const environment = getSecurityEnvironment();
  const secrets = [environment.TOKEN_HASH_SECRET];

  if (environment.TOKEN_HASH_SECRET_PREVIOUS) {
    secrets.push(environment.TOKEN_HASH_SECRET_PREVIOUS);
  }

  return secrets;
}

/** peppers فعال و قبلی کد OTP برای چرخش — اولی primary است. */
export function getOtpPepperSecrets(): string[] {
  const environment = getSecurityEnvironment();
  const peppers = [environment.OTP_HASH_PEPPER];

  if (environment.OTP_HASH_PEPPER_PREVIOUS) {
    peppers.push(environment.OTP_HASH_PEPPER_PREVIOUS);
  }

  return peppers;
}

export function hashPayload(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function hashOtp(
  phone: string,
  purpose: string,
  code: string,
  pepper: string,
): string {
  return createHmac("sha256", pepper)
    .update(`${phone}:${purpose}:${code}`)
    .digest("hex");
}

export type HmacEncoding = "hex" | "base64url";

function signWithSecret(
  payload: string,
  secret: string,
  encoding: HmacEncoding,
): string {
  return createHmac("sha256", secret).update(payload).digest(encoding);
}

/** امضای HMAC با secret اصلی. */
export function signPayload(
  payload: string,
  encoding: HmacEncoding = "hex",
): string {
  return signWithSecret(payload, getSecurityEnvironment().TOKEN_HASH_SECRET, encoding);
}

/** بررسی امضا با secret اصلی و قبلی؛ برای تحمل دوره rotation. */
export function verifyPayloadSignature(input: {
  encoding?: HmacEncoding;
  payload: string;
  signature: string;
}): boolean {
  const encoding = input.encoding ?? "hex";

  for (const secret of getTokenHashSecrets()) {
    const expected = signWithSecret(input.payload, secret, encoding);
    if (safeEqual(expected, input.signature)) {
      return true;
    }
  }

  return false;
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ADMIN_PASSWORD_POLICY.argon2id.memoryKiB,
    timeCost: ADMIN_PASSWORD_POLICY.argon2id.iterations,
    parallelism: ADMIN_PASSWORD_POLICY.argon2id.parallelism,
  });
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
