import { describe, expect, it } from "vitest";

import { redactAuditValue } from "@/server/modules/admin-audit/admin-audit.redaction";

describe("admin audit redaction", () => {
  it("redacts sensitive keys and partial phone", () => {
    expect(
      redactAuditValue({
        name: "Admin",
        password: "super-secret",
        phone: "09121234567",
        token: "abc",
        nested: { refreshToken: "xyz" },
      }),
    ).toEqual({
      name: "Admin",
      password: "[REDACTED]",
      phone: "0912****67",
      token: "[REDACTED]",
      nested: { refreshToken: "[REDACTED]" },
    });
  });
});
