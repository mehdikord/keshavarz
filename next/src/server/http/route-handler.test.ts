import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";
import { apiSuccess, withApiHandler } from "@/server/http";

describe("withApiHandler", () => {
  it("uses the same request ID in body and header", async () => {
    const handler = withApiHandler(async (_request, context) =>
      apiSuccess({ ok: true }, context.requestId),
    );
    const response = await handler(
      new NextRequest("http://localhost/api/app/v1/health"),
    );
    const body = (await response.json()) as { requestId: string };

    expect(response.headers.get("X-Request-Id")).toBe(body.requestId);
    expect(body.requestId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("serializes API errors without internal details", async () => {
    const handler = withApiHandler(async () => {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "تعارض داده رخ داده است.",
      );
    });
    const response = await handler(
      new NextRequest("http://localhost/api/app/v1/example"),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      error: {
        code: "CONFLICT",
        message: "تعارض داده رخ داده است.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("redacts unexpected server errors", async () => {
    const handler = withApiHandler(async () => {
      throw new Error("database password=do-not-expose");
    });
    const response = await handler(
      new NextRequest("http://localhost/api/app/v1/example"),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "خطای داخلی رخ داده است.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("do-not-expose");
  });

  it("keeps the real cause in logs while the client response stays redacted", async () => {
    const writes: string[] = [];
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk: string | Uint8Array) => {
        writes.push(String(chunk));
        return true;
      });

    const handler = withApiHandler(async () => {
      throw new Error("SMS queue is not configured.");
    });
    const response = await handler(
      new NextRequest("http://localhost/api/app/v1/example"),
    );
    const body = await response.json();

    writeSpy.mockRestore();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "خطای داخلی رخ داده است.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("SMS queue is not configured");
    expect(writes.join("\n")).toContain("api.request.failed");
    expect(writes.join("\n")).toContain("SMS queue is not configured");
  });
});
