import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

export function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const candidate =
    forwardedFor?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim();

  return candidate && candidate.length <= 45 ? candidate : null;
}

export function getUserAgent(request: NextRequest): string | null {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent ? userAgent.slice(0, 1000) : null;
}

export function getDeviceFingerprint(request: NextRequest): string {
  const deviceId = request.headers.get("x-device-id")?.trim() ?? "";
  const userAgent = getUserAgent(request) ?? "";
  return createHash("sha256")
    .update(`${deviceId}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}
