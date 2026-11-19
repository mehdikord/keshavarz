import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";
import type { ApiSuccessEnvelope } from "@/lib/api/envelope";

export const AdminMeSchema = z
  .object({
    adminId: z.string().min(1),
    email: z.string().email().nullable(),
    image: z.string().nullable(),
    isSuperAdmin: z.boolean(),
    name: z.string().min(1),
    permissions: z.array(z.string()),
    phone: z.string().min(1),
  })
  .strict();

export type AdminMe = z.infer<typeof AdminMeSchema>;

export const AdminLoginResultSchema = z
  .object({
    adminId: z.string().min(1),
  })
  .strict();

export async function loginAdmin(input: {
  password: string;
  phone: string;
}): Promise<ApiSuccessEnvelope<{ adminId: string }>> {
  // Login is Origin-gated but not CSRF-gated (cookies not yet established).
  return adminApi.post("/auth/login", input, { csrf: false });
}

export async function fetchAdminMe(
  signal?: AbortSignal,
): Promise<AdminMe> {
  const result = await adminApi.get<unknown>("/me", { signal });
  return AdminMeSchema.parse(result.data);
}

export async function patchAdminMe(input: {
  email?: string | null;
  name?: string;
}): Promise<AdminMe> {
  const result = await adminApi.patch<unknown>("/me", input);
  return AdminMeSchema.parse(result.data);
}

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await adminApi.post("/me/change-password", input);
}

export async function logoutAdminSession(): Promise<void> {
  await adminApi.delete("/auth/session");
}

export async function logoutAllAdminSessions(): Promise<void> {
  await adminApi.delete("/auth/sessions");
}

export async function refreshAdminSession(): Promise<void> {
  await adminApi.post("/auth/session/refresh", {});
}

export async function logoutOtherAdminSessions(): Promise<number> {
  const result = await adminApi.delete<{ revokedCount: number }>("/auth/sessions", {
    query: { scope: "others" },
  });
  return result.data.revokedCount;
}

export const AdminSessionInfoSchema = z
  .object({
    absoluteLifetimeSeconds: z.number().int().positive(),
    createdAt: z.string().min(1),
    expiresAt: z.string().min(1),
    idleTimeoutSeconds: z.number().int().positive(),
    lastActivityAt: z.string().min(1),
    refreshWindowSeconds: z.number().int().positive(),
    serverTime: z.string().min(1),
  })
  .strict();

export type AdminSessionInfo = z.infer<typeof AdminSessionInfoSchema>;

export async function fetchAdminSessionInfo(): Promise<AdminSessionInfo> {
  const result = await adminApi.get<unknown>("/auth/session");
  return AdminSessionInfoSchema.parse(result.data);
}

export const AdminDeviceSessionSchema = z
  .object({
    createdAt: z.string().min(1),
    current: z.boolean(),
    expiresAt: z.string().min(1),
    ipAddress: z.string().nullable(),
    lastActivityAt: z.string().min(1),
    sessionId: z.string().min(1),
    userAgent: z.string().nullable(),
  })
  .strict();

export type AdminDeviceSession = z.infer<typeof AdminDeviceSessionSchema>;

export async function listAdminDeviceSessions(): Promise<AdminDeviceSession[]> {
  const result = await adminApi.get<unknown>("/auth/sessions");
  return z.array(AdminDeviceSessionSchema).parse(result.data);
}

export async function revokeAdminDeviceSession(sessionId: string): Promise<void> {
  await adminApi.delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
}
