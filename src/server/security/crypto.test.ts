import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getOtpPepperSecrets,
  getTokenHashSecrets,
  hashOtp,
  hashToken,
  verifyPayloadSignature,
} from "@/server/security/crypto";

const primarySecret = "primary-secret-0123456789abcdef-0123456789abcdef";
const previousSecret = "previous-secret-0123456789abcdef-0123456789abcd";

function resetRotationEnv() {
  process.env.TOKEN_HASH_SECRET = primarySecret;
  process.env.OTP_HASH_PEPPER = primarySecret;
  delete process.env.TOKEN_HASH_SECRET_PREVIOUS;
  delete process.env.OTP_HASH_PEPPER_PREVIOUS;
}

function withPreviousSecrets(callback: () => void) {
  process.env.TOKEN_HASH_SECRET_PREVIOUS = previousSecret;
  process.env.OTP_HASH_PEPPER_PREVIOUS = previousSecret;
  try {
    callback();
  } finally {
    delete process.env.TOKEN_HASH_SECRET_PREVIOUS;
    delete process.env.OTP_HASH_PEPPER_PREVIOUS;
  }
}

describe("crypto secret rotation", () => {
  beforeEach(() => {
    resetRotationEnv();
  });

  afterEach(() => {
    delete process.env.TOKEN_HASH_SECRET;
    delete process.env.OTP_HASH_PEPPER;
    delete process.env.TOKEN_HASH_SECRET_PREVIOUS;
    delete process.env.OTP_HASH_PEPPER_PREVIOUS;
  });

  it("defaults to a single secret when no previous value is set", () => {
    expect(getTokenHashSecrets()).toHaveLength(1);
    expect(getOtpPepperSecrets()).toHaveLength(1);
  });

  it("includes the previous secret during rotation", () => {
    withPreviousSecrets(() => {
      expect(getTokenHashSecrets()).toEqual([primarySecret, previousSecret]);
      expect(getOtpPepperSecrets()).toEqual([primarySecret, previousSecret]);
    });
  });

  it("verifies signatures produced by the previous secret during rotation", () => {
    withPreviousSecrets(() => {
      const payload = "some-signed-payload";
      const previousSignature = signPayloadWith(previousSecret, payload);
      const primarySignature = signPayloadWith(primarySecret, payload);

      expect(
        verifyPayloadSignature({ payload, signature: previousSignature }),
      ).toBe(true);
      expect(
        verifyPayloadSignature({ payload, signature: primarySignature }),
      ).toBe(true);
      expect(
        verifyPayloadSignature({
          payload,
          signature: "invalid-signature",
        }),
      ).toBe(false);
    });
  });

  it("rejects signatures from the previous secret once rotation is over", () => {
    const payload = "some-signed-payload";
    const previousSignature = signPayloadWith(previousSecret, payload);

    expect(
      verifyPayloadSignature({ payload, signature: previousSignature }),
    ).toBe(false);
  });

  it("token and otp hashing still depend on the provided secret", () => {
    const tokenHash = hashToken("opaque-token", primarySecret);
    const otpHash = hashOtp("09120000000", "login", "123456", primarySecret);

    expect(tokenHash).not.toBe(hashToken("opaque-token", previousSecret));
    expect(otpHash).not.toBe(
      hashOtp("09120000000", "login", "123456", previousSecret),
    );
  });
});

function signPayloadWith(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}
