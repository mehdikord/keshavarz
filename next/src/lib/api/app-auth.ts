import * as z from "zod";

import { appApi } from "@/lib/api/app-client";
import type { ApiSuccessEnvelope } from "@/lib/api/envelope";
import { DEFAULT_DISPLAY_NAME } from "@/lib/app/defaults";
import type { User } from "@/types";

export const AppMeSchema = z
  .object({
    capabilities: z
      .object({
        consumer: z.literal(true),
        provider: z
          .object({
            active: z.boolean(),
            approved: z.boolean(),
            available: z.boolean(),
          })
          .nullable(),
      })
      .strict(),
    city: z
      .object({
        cityId: z.string().min(1),
        name: z.string(),
        provinceId: z.string().min(1),
      })
      .strict()
      .nullable(),
    image: z.string().nullable(),
    locale: z.string(),
    name: z.string(),
    phone: z.string(),
    province: z
      .object({
        name: z.string(),
        provinceId: z.string().min(1),
      })
      .strict()
      .nullable(),
    timezone: z.string(),
    userId: z.string().min(1),
  })
  .strict();

export type AppMe = z.infer<typeof AppMeSchema>;

export const AppOtpRequestResultSchema = z
  .object({
    message: z.string(),
  })
  .strict();

export const AppOtpVerifyResultSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export const AppSessionSchema = z
  .object({
    createdAt: z.string(),
    current: z.boolean(),
    deviceName: z.string().nullable(),
    expiresAt: z.string(),
    ipAddress: z.string().nullable(),
    lastActivityAt: z.string(),
    platform: z.string().nullable(),
    revoked: z.boolean(),
    sessionId: z.string(),
  })
  .strict();

export type AppSession = z.infer<typeof AppSessionSchema>;

export function mapAppMeToUser(me: AppMe): User {
  const now = new Date().toISOString();
  return {
    city: me.city ?? null,
    createdAt: now,
    displayName: me.name.trim() || DEFAULT_DISPLAY_NAME,
    id: me.userId,
    phone: me.phone,
    province: me.province ?? null,
    updatedAt: now,
  };
}

export async function requestAppOtp(input: {
  phone: string;
}): Promise<ApiSuccessEnvelope<{ message: string }>> {
  const result = await appApi.post<unknown>(
    "/auth/otp/request",
    { phone: input.phone },
    { csrf: false },
  );
  return {
    ...result,
    data: AppOtpRequestResultSchema.parse(result.data),
  };
}

export async function resendAppOtp(input: {
  phone: string;
}): Promise<ApiSuccessEnvelope<{ message: string }>> {
  const result = await appApi.post<unknown>(
    "/auth/otp/resend",
    { phone: input.phone },
    { csrf: false },
  );
  return {
    ...result,
    data: AppOtpRequestResultSchema.parse(result.data),
  };
}

export async function verifyAppOtp(input: {
  code: string;
  phone: string;
  platform?: "web" | "pwa" | "android" | "ios";
  deviceId?: string;
  deviceName?: string;
}): Promise<{ userId: string }> {
  const result = await appApi.post<unknown>(
    "/auth/otp/verify",
    {
      code: input.code,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      phone: input.phone,
      platform: input.platform ?? "web",
    },
    { csrf: false },
  );
  return AppOtpVerifyResultSchema.parse(result.data);
}

export async function fetchAppMe(signal?: AbortSignal): Promise<AppMe> {
  const result = await appApi.get<unknown>("/me", { signal });
  return AppMeSchema.parse(result.data);
}

export async function patchAppMe(input: {
  cityId?: string;
  locale?: string;
  name?: string;
  provinceId?: string;
  timezone?: string;
}): Promise<AppMe> {
  const result = await appApi.patch<unknown>("/me", input);
  return AppMeSchema.parse(result.data);
}

export async function refreshAppSession(): Promise<void> {
  await appApi.post("/auth/session/refresh", {});
}

export async function logoutAppSession(): Promise<void> {
  await appApi.delete("/auth/session");
}

export async function logoutAllAppSessions(): Promise<{ revokedCount: number }> {
  const result = await appApi.delete<unknown>("/auth/sessions");
  return z
    .object({ revokedCount: z.number().int() })
    .strict()
    .parse(result.data);
}

export async function listAppSessions(
  signal?: AbortSignal,
): Promise<AppSession[]> {
  const result = await appApi.get<unknown>("/me/sessions", { signal });
  return z
    .object({ sessions: z.array(AppSessionSchema) })
    .strict()
    .parse(result.data).sessions;
}

export async function revokeAppSession(sessionId: string): Promise<void> {
  await appApi.delete(`/me/sessions/${encodeURIComponent(sessionId)}`);
}

export async function uploadAppMeImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);
  const result = await appApi.put("/me/image", undefined, {
    formData,
    csrf: true,
  });
  return z.object({ image: z.string() }).parse(result.data);
}

export async function deleteAppMeImage() {
  await appApi.delete("/me/image");
}
