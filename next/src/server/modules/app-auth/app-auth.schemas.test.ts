import { describe, expect, it } from "vitest";

import {
  IranianMobileSchema,
  ProfileUpdateSchema,
} from "@/server/modules/app-auth/app-auth.schemas";

describe("app auth schemas", () => {
  it.each([
    ["09121234567", "09121234567"],
    ["+989121234567", "09121234567"],
    ["00989121234567", "09121234567"],
    ["۰۹۱۲۱۲۳۴۵۶۷", "09121234567"],
  ])("normalizes Iranian mobile %s", (input, expected) => {
    expect(IranianMobileSchema.parse(input)).toBe(expected);
  });

  it("rejects non-Iranian mobile numbers", () => {
    expect(() => IranianMobileSchema.parse("02112345678")).toThrow();
  });

  it("does not allow phone changes in profile input", () => {
    expect(() =>
      ProfileUpdateSchema.parse({ name: "کاربر", phone: "09121234567" }),
    ).toThrow();
  });
});
