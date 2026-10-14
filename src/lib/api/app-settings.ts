import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

export const SETTING_VALUE_TYPES = [
  "string",
  "integer",
  "boolean",
  "json",
] as const;

export const PublicSettingSchema = z
  .object({
    description: z.string().nullable(),
    group: z.string(),
    key: z.string(),
    settingValue: z.unknown(),
    updatedAt: z.string(),
    valueType: z.enum(SETTING_VALUE_TYPES),
  })
  .strict();

export type PublicSetting = z.infer<typeof PublicSettingSchema>;

export async function fetchPublicSettings(input?: {
  signal?: AbortSignal;
}): Promise<PublicSetting[]> {
  const result = await appApi.get<unknown>("/public/settings", {
    signal: input?.signal,
  });
  const parsed = z
    .object({ settings: z.array(PublicSettingSchema) })
    .parse(result.data);
  return parsed.settings;
}
