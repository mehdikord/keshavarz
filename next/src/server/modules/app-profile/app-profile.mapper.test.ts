import { describe, expect, it } from "vitest";

import { mapCurrentUserProfile } from "@/server/modules/app-profile/app-profile.mapper";

describe("current user profile mapper", () => {
  it("exposes consumer capability and null provider when absent", () => {
    expect(
      mapCurrentUserProfile({
        image: null,
        locale: "fa-IR",
        name: "کاربر کشاورز",
        phone: "09121234567",
        providerProfile: null,
        publicId: "01HZYABCDEFGHJKMNPQRSTUVWX",
        timezone: "Asia/Tehran",
      }),
    ).toMatchObject({
      capabilities: {
        consumer: true,
        provider: null,
      },
      phone: "09121234567",
      userId: "01HZYABCDEFGHJKMNPQRSTUVWX",
    });
  });

  it("maps provider capability flags when profile exists", () => {
    expect(
      mapCurrentUserProfile({
        image: "https://cdn.example/a.jpg",
        locale: "fa-IR",
        name: "ارائه‌دهنده",
        phone: "09121234567",
        providerProfile: {
          approvedAt: new Date("2026-01-01T00:00:00.000Z"),
          isActive: 1,
          isAvailable: 0,
        },
        publicId: "01HZYABCDEFGHJKMNPQRSTUVWX",
        timezone: "Asia/Tehran",
      }).capabilities.provider,
    ).toEqual({
      active: true,
      approved: true,
      available: false,
    });
  });
});
