import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  findSystemSetting,
  listSystemSettings,
  upsertSystemSetting,
} from "@/server/modules/admin-settings/admin-settings.repository";
import type { SystemSettingValueType } from "@/server/modules/admin-settings/admin-settings.schemas";

function mapSetting(setting: {
  description: string | null;
  isPublic: number;
  settingGroup: string;
  settingKey: string;
  settingValue: unknown;
  updatedAt: Date;
  updatedByAdmin: { publicId: string } | null;
  valueType: string;
}) {
  return {
    description: setting.description,
    group: setting.settingGroup,
    isPublic: setting.isPublic === 1,
    key: setting.settingKey,
    settingValue: setting.settingValue,
    updatedAt: setting.updatedAt.toISOString(),
    updatedByAdminId: setting.updatedByAdmin?.publicId ?? null,
    valueType: setting.valueType,
  };
}

function assertValueMatchesType(
  valueType: SystemSettingValueType,
  settingValue: unknown,
): unknown {
  switch (valueType) {
    case "string":
      if (typeof settingValue !== "string") {
        throw new ApiError(
          422,
          API_ERROR_CODES.validationFailed,
          "مقدار باید رشته باشد.",
          { fields: { settingValue: ["مقدار باید رشته باشد."] } },
        );
      }
      return settingValue;
    case "integer":
      if (
        typeof settingValue !== "number" ||
        !Number.isInteger(settingValue) ||
        !Number.isSafeInteger(settingValue)
      ) {
        throw new ApiError(
          422,
          API_ERROR_CODES.validationFailed,
          "مقدار باید عدد صحیح باشد.",
          { fields: { settingValue: ["مقدار باید عدد صحیح باشد."] } },
        );
      }
      return settingValue;
    case "boolean":
      if (typeof settingValue !== "boolean") {
        throw new ApiError(
          422,
          API_ERROR_CODES.validationFailed,
          "مقدار باید بولین باشد.",
          { fields: { settingValue: ["مقدار باید بولین باشد."] } },
        );
      }
      return settingValue;
    case "json":
      if (
        settingValue === null ||
        typeof settingValue === "string" ||
        typeof settingValue === "number" ||
        typeof settingValue === "boolean" ||
        Array.isArray(settingValue) ||
        (typeof settingValue === "object" && settingValue !== null)
      ) {
        return settingValue;
      }
      throw new ApiError(
        422,
        API_ERROR_CODES.validationFailed,
        "مقدار JSON معتبر نیست.",
        { fields: { settingValue: ["مقدار JSON معتبر نیست."] } },
      );
  }
}

export async function listSettingsForAdmin(input: { group?: string }) {
  const rows = await listSystemSettings(input);
  return { settings: rows.map(mapSetting) };
}

export async function upsertSettingForAdmin(input: {
  description?: string | null;
  group: string;
  isPublic?: 0 | 1;
  key: string;
  settingValue: unknown;
  updatedByAdminId: bigint;
  valueType: SystemSettingValueType;
}) {
  const validatedValue = assertValueMatchesType(
    input.valueType,
    input.settingValue,
  );
  const previous = await findSystemSetting(input.group, input.key);
  const setting = await upsertSystemSetting({
    description: input.description,
    group: input.group,
    isPublic: input.isPublic,
    key: input.key,
    settingValue: validatedValue,
    updatedByAdminId: input.updatedByAdminId,
    valueType: input.valueType,
  });

  return {
    newValues: mapSetting(setting),
    oldValues: previous ? mapSetting(previous) : null,
    settingId: setting.id,
  };
}
