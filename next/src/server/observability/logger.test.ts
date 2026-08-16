import { describe, expect, it } from "vitest";

import { redactLogValue } from "@/server/observability";

describe("redactLogValue", () => {
  it("redacts nested secrets and tokens", () => {
    expect(
      redactLogValue({
        password: "secret",
        nested: {
          sessionToken: "raw-session",
          status: "ok",
        },
      }),
    ).toEqual({
      password: "[REDACTED]",
      nested: {
        sessionToken: "[REDACTED]",
        status: "ok",
      },
    });
  });
});
