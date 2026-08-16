import * as z from "zod";

const SettingValueTypeSchema = z.enum([
  "string",
  "integer",
  "boolean",
  "json",
]);

export const AdminSettingsQuerySchema = z
  .object({
    group: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const AdminSettingParamsSchema = z
  .object({
    group: z.string().trim().min(1).max(80),
    key: z.string().trim().min(1).max(150),
  })
  .strict();

export const AdminSettingUpsertSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    isPublic: z.union([z.literal(0), z.literal(1)]).optional(),
    settingValue: z.unknown(),
    valueType: SettingValueTypeSchema,
  })
  .strict();

export type SystemSettingValueType = z.infer<typeof SettingValueTypeSchema>;
