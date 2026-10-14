import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  requireAdminSession,
  requireUserSession,
} from "@/server/auth";

describe("session guards", () => {
  it("rejects a missing app session", async () => {
    const request = new NextRequest(
      "http://localhost/api/app/v1/health/authenticated",
    );

    await expect(requireUserSession(request)).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      status: 401,
    });
  });

  it("rejects a missing admin session", async () => {
    const request = new NextRequest(
      "http://localhost/api/admins/v1/health/authenticated",
    );

    await expect(requireAdminSession(request)).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      status: 401,
    });
  });
});
