import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";

export const SETTING_VALUE_TYPES = [
  "string",
  "integer",
  "boolean",
  "json",
] as const;

export type AdminSettingValueType = (typeof SETTING_VALUE_TYPES)[number];

export const AdminSettingSchema = z
  .object({
    description: z.string().nullable(),
    group: z.string(),
    isPublic: z.boolean(),
    key: z.string(),
    settingValue: z.unknown(),
    updatedAt: z.string(),
    updatedByAdminId: z.string().nullable(),
    valueType: z.enum(SETTING_VALUE_TYPES),
  })
  .strict();

export type AdminSetting = z.infer<typeof AdminSettingSchema>;

export async function fetchAdminSettings(input?: {
  group?: string;
  signal?: AbortSignal;
}): Promise<AdminSetting[]> {
  const result = await adminApi.get<unknown>("/settings", {
    query: { group: input?.group },
    signal: input?.signal,
  });
  const parsed = z.object({ settings: z.array(AdminSettingSchema) }).parse(result.data);
  return parsed.settings;
}

export async function upsertAdminSetting(input: {
  description?: string | null;
  group: string;
  isPublic?: 0 | 1;
  key: string;
  settingValue: unknown;
  valueType: AdminSettingValueType;
}): Promise<AdminSetting> {
  const result = await adminApi.put<unknown>(
    `/settings/${encodeURIComponent(input.group)}/${encodeURIComponent(input.key)}`,
    {
      description: input.description,
      isPublic: input.isPublic,
      settingValue: input.settingValue,
      valueType: input.valueType,
    },
  );
  return AdminSettingSchema.parse(result.data);
}
