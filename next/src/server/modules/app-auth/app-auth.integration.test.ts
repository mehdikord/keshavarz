import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { requireUserSession } from "@/server/auth";
import { getSecurityEnvironment } from "@/server/config/env";
import { APP_SESSION_POLICY, OTP_POLICY } from "@/server/contracts";
import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import type { SmsQueue } from "@/server/integrations";
import { runAppAuthCleanupJob } from "@/server/jobs/app-auth-cleanup";
import {
  requestLoginOtp,
  rotateUserSession,
  verifyLoginOtp,
} from "@/server/modules/app-auth/app-auth.service";
import { hashOtp, hashToken } from "@/server/security";

const phones = [
  "09991000001",
  "09991000002",
  "09991000003",
  "09991000004",
  "09991000005",
  "09991000006",
  "09991000007",
  "09991000008",
  "09991000009",
  "09991000010",
  "09991000011",
  "09991000012",
];

const smsQueue: SmsQueue = {
  enqueue: async () => ({ jobId: "test-sms-job" }),
};

function request(ip = "127.0.0.99") {
  return new NextRequest("http://localhost/api/app/v1/auth/otp/verify", {
    headers: {
      "user-agent": "vitest",
      "x-device-id": "vitest-device",
      "x-forwarded-for": ip,
    },
  });
}

async function createOtp(input: {
  attemptsCount?: number;
  code?: string;
  consumedAt?: Date;
  expiresAt?: Date;
  phone: string;
}) {
  const code = input.code ?? "123456";
  return prisma.userOtpCode.create({
    data: {
      attemptsCount: input.attemptsCount ?? 0,
      codeHash: hashOtp(
        input.phone,
        "login",
        code,
        getSecurityEnvironment().OTP_HASH_PEPPER,
      ),
      consumedAt: input.consumedAt,
      expiresAt:
        input.expiresAt ??
        new Date(Date.now() + OTP_POLICY.expiresInSeconds * 1000),
      maxAttempts: OTP_POLICY.maxAttempts,
      phone: input.phone,
      purpose: "login",
    },
  });
}

async function cleanup() {
  await prisma.userOtpCode.deleteMany({ where: { phone: { in: phones } } });
  await prisma.userSession.deleteMany({
    where: { user: { phone: { in: phones } } },
  });
  await prisma.user.deleteMany({ where: { phone: { in: phones } } });
}

describe.sequential("app OTP authentication integration", () => {
  beforeAll(cleanup, 60_000);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("creates a new user with default name and stores only OTP/token hashes", async () => {
    const phone = phones[0]!;
    await createOtp({ phone });
    const result = await verifyLoginOtp(
      { code: "123456", phone, platform: "pwa" },
      request(),
    );
    const [otp, session, user] = await Promise.all([
      prisma.userOtpCode.findFirstOrThrow({ where: { phone } }),
      prisma.userSession.findFirstOrThrow({ where: { user: { phone } } }),
      prisma.user.findUniqueOrThrow({ where: { phone } }),
    ]);

    expect(result.userId).toBe(user.publicId);
    expect(user.name).toBe("کاربر کشاورز");
    expect(otp.codeHash).not.toBe("123456");
    expect(otp.consumedAt).not.toBeNull();
    expect(session.tokenHash).not.toBe(result.sessionToken);
    expect(session.tokenHash).toHaveLength(64);
  });

  it("updates an existing user login without creating a duplicate", async () => {
    const phone = phones[1]!;
    await prisma.user.create({ data: { phone, publicId: createPublicId() } });
    await createOtp({ phone });
    await verifyLoginOtp({ code: "123456", phone, platform: "web" }, request());
    expect(await prisma.user.count({ where: { phone } })).toBe(1);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { phone } })).lastLoginAt,
    ).not.toBeNull();
  });

  it.each([
    ["incorrect", { storeCode: "123456", verifyCode: "654321" }],
    [
      "expired",
      {
        expiresAt: new Date(Date.now() - 1000),
        storeCode: "123456",
        verifyCode: "123456",
      },
    ],
    [
      "consumed",
      {
        consumedAt: new Date(),
        storeCode: "123456",
        verifyCode: "123456",
      },
    ],
    [
      "attempts exhausted",
      {
        attemptsCount: OTP_POLICY.maxAttempts,
        storeCode: "123456",
        verifyCode: "123456",
      },
    ],
  ])("rejects %s OTP", async (_name, scenario) => {
    const phone = phones[2]!;
    await prisma.userOtpCode.deleteMany({ where: { phone } });
    await createOtp({
      attemptsCount:
        "attemptsCount" in scenario ? scenario.attemptsCount : undefined,
      code: scenario.storeCode,
      consumedAt:
        "consumedAt" in scenario ? scenario.consumedAt : undefined,
      expiresAt: "expiresAt" in scenario ? scenario.expiresAt : undefined,
      phone,
    });
    await expect(
      verifyLoginOtp(
        { code: scenario.verifyCode, phone, platform: "pwa" },
        request(),
      ),
    ).rejects.toMatchObject({ code: "INVALID_OTP", status: 400 });
  });

  it("rejects an inactive user", async () => {
    const phone = phones[3]!;
    await prisma.user.create({
      data: { isActive: 0, phone, publicId: createPublicId() },
    });
    await createOtp({ phone });
    await expect(
      verifyLoginOtp({ code: "123456", phone, platform: "pwa" }, request()),
    ).rejects.toMatchObject({ code: "ACCOUNT_UNAVAILABLE", status: 403 });
  });

  it("rejects a deleted user", async () => {
    const phone = phones[4]!;
    await prisma.user.create({
      data: {
        deletedAt: new Date(),
        phone,
        publicId: createPublicId(),
      },
    });
    await createOtp({ phone });
    await expect(
      verifyLoginOtp({ code: "123456", phone, platform: "pwa" }, request()),
    ).rejects.toMatchObject({ code: "ACCOUNT_UNAVAILABLE", status: 403 });
  });

  it("allows only one concurrent verification of the same OTP", async () => {
    const phone = phones[5]!;
    await createOtp({ phone });
    const results = await Promise.allSettled([
      verifyLoginOtp({ code: "123456", phone, platform: "pwa" }, request()),
      verifyLoginOtp({ code: "123456", phone, platform: "pwa" }, request()),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(
      await prisma.userSession.count({ where: { user: { phone } } }),
    ).toBe(1);
  });

  it("rejects a revoked session", async () => {
    const phone = phones[6]!;
    const token = "revoked-session-token";
    const user = await prisma.user.create({
      data: { phone, publicId: createPublicId() },
    });
    await prisma.userSession.create({
      data: {
        expiresAt: new Date(Date.now() + 60_000),
        publicId: createPublicId(),
        revokedAt: new Date(),
        tokenHash: hashToken(token, getSecurityEnvironment().TOKEN_HASH_SECRET),
        userId: user.id,
      },
    });
    const sessionRequest = new NextRequest(
      "http://localhost/api/app/v1/health/authenticated",
      { headers: { cookie: `__Secure-keshavarz_app_session=${token}` } },
    );
    await expect(requireUserSession(sessionRequest)).rejects.toMatchObject({
      code: "INVALID_SESSION",
      status: 401,
    });
  });

  it("rejects early OTP resend with Retry-After", async () => {
    const phone = phones[7]!;
    const response = await requestLoginOtp({ phone }, request("127.0.0.71"), smsQueue);
    expect(response.message).toContain("کد تأیید");

    await expect(
      requestLoginOtp({ phone }, request("127.0.0.71"), smsQueue),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
    });
  });

  it("rejects brute-force OTP attempts after maxAttempts", async () => {
    const phone = phones[8]!;
    await createOtp({ phone });

    for (let attempt = 0; attempt < OTP_POLICY.maxAttempts; attempt += 1) {
      await expect(
        verifyLoginOtp(
          { code: "000000", phone, platform: "pwa" },
          request("127.0.0.72"),
        ),
      ).rejects.toMatchObject({ code: "INVALID_OTP", status: 400 });
    }

    await expect(
      verifyLoginOtp(
        { code: "123456", phone, platform: "pwa" },
        request("127.0.0.72"),
      ),
    ).rejects.toMatchObject({ code: "INVALID_OTP", status: 400 });
  });

  it("rotates within refresh window and revokes family on reused token", async () => {
    const phone = phones[9]!;
    const user = await prisma.user.create({
      data: { phone, publicId: createPublicId() },
    });
    const oldToken = "rotate-old-token";
    const deviceId = "device-family-1";
    const session = await prisma.userSession.create({
      data: {
        deviceId,
        expiresAt: new Date(
          Date.now() + APP_SESSION_POLICY.refreshWindowSeconds * 1000 - 60_000,
        ),
        publicId: createPublicId(),
        tokenHash: hashToken(
          oldToken,
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
        userId: user.id,
      },
    });

    const rotated = await rotateUserSession({
      currentSessionId: session.id,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    expect(rotated.sessionToken).not.toBe(oldToken);
    expect(
      (
        await prisma.userSession.findUniqueOrThrow({ where: { id: session.id } })
      ).revokedAt,
    ).not.toBeNull();

    const reuseRequest = new NextRequest(
      "http://localhost/api/app/v1/health/authenticated",
      { headers: { cookie: `__Secure-keshavarz_app_session=${oldToken}` } },
    );
    await expect(requireUserSession(reuseRequest)).rejects.toMatchObject({
      code: "INVALID_SESSION",
      status: 401,
    });
    expect(
      await prisma.userSession.count({
        where: { revokedAt: null, userId: user.id },
      }),
    ).toBe(0);
  });

  it("rejects refresh outside the final refresh window", async () => {
    const phone = phones[10]!;
    const user = await prisma.user.create({
      data: { phone, publicId: createPublicId() },
    });
    const session = await prisma.userSession.create({
      data: {
        expiresAt: new Date(
          Date.now() +
            APP_SESSION_POLICY.refreshWindowSeconds * 1000 +
            24 * 60 * 60 * 1000,
        ),
        publicId: createPublicId(),
        tokenHash: hashToken(
          "outside-window-token",
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
        userId: user.id,
      },
    });

    await expect(
      rotateUserSession({
        currentSessionId: session.id,
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      }),
    ).rejects.toMatchObject({ code: "INVALID_SESSION", status: 401 });
  });

  it("cleans up expired OTP and session records", async () => {
    const phone = phones[11]!;
    const user = await prisma.user.create({
      data: { phone, publicId: createPublicId() },
    });
    await prisma.userOtpCode.create({
      data: {
        codeHash: hashOtp(
          phone,
          "login",
          "999999",
          getSecurityEnvironment().OTP_HASH_PEPPER,
        ),
        expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        maxAttempts: OTP_POLICY.maxAttempts,
        phone,
        purpose: "login",
      },
    });
    await prisma.userSession.create({
      data: {
        expiresAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        publicId: createPublicId(),
        tokenHash: hashToken(
          "cleanup-session-token",
          getSecurityEnvironment().TOKEN_HASH_SECRET,
        ),
        userId: user.id,
      },
    });

    const result = await runAppAuthCleanupJob();
    expect(result.otps).toBeGreaterThanOrEqual(1);
    expect(result.sessions).toBeGreaterThanOrEqual(1);
    expect(await prisma.userOtpCode.count({ where: { phone } })).toBe(0);
    expect(
      await prisma.userSession.count({ where: { userId: user.id } }),
    ).toBe(0);
  });
});
