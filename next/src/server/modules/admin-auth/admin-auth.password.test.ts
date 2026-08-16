import { describe, expect, it } from "vitest";

import {
  assertAdminPasswordPolicy,
  nextAdminLockoutSeconds,
} from "@/server/modules/admin-auth/admin-auth.password";
import { ADMIN_PASSWORD_POLICY } from "@/server/contracts";

describe("admin password policy", () => {
  it("rejects short and common passwords", () => {
    expect(() =>
      assertAdminPasswordPolicy("short", { name: "Ali", phone: "09121234567" }),
    ).toThrow();
    expect(() =>
      assertAdminPasswordPolicy("password1234", {
        name: "Ali",
        phone: "09121234567",
      }),
    ).toThrow();
  });

  it("rejects password containing phone or name parts", () => {
    expect(() =>
      assertAdminPasswordPolicy("xx09121234567yy", {
        name: "کاربر",
        phone: "09121234567",
      }),
    ).toThrow();
    expect(() =>
      assertAdminPasswordPolicy("SuperRezaAdmin1!", {
        name: "Reza Karimi",
        phone: "09120000000",
      }),
    ).toThrow();
  });

  it("accepts a strong password", () => {
    expect(() =>
      assertAdminPasswordPolicy("Tr0ub4dor&3-safe", {
        name: "Reza",
        phone: "09121234567",
      }),
    ).not.toThrow();
  });

  it("progresses lockout duration up to maximum", () => {
    expect(nextAdminLockoutSeconds(4)).toBe(0);
    expect(nextAdminLockoutSeconds(5)).toBe(
      ADMIN_PASSWORD_POLICY.initialLockoutSeconds,
    );
    expect(nextAdminLockoutSeconds(10)).toBe(
      ADMIN_PASSWORD_POLICY.initialLockoutSeconds * 2,
    );
    expect(nextAdminLockoutSeconds(100)).toBe(
      ADMIN_PASSWORD_POLICY.maximumLockoutSeconds,
    );
  });
});
