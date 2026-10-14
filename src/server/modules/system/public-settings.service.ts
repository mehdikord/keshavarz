import { listPublicSystemSettings } from "@/server/modules/system/public-settings.repository";

function mapPublicSetting(setting: {
  description: string | null;
  settingGroup: string;
  settingKey: string;
  settingValue: unknown;
  updatedAt: Date;
  valueType: string;
}) {
  return {
    description: setting.description,
    group: setting.settingGroup,
    key: setting.settingKey,
    settingValue: setting.settingValue,
    updatedAt: setting.updatedAt.toISOString(),
    valueType: setting.valueType,
  };
}

/** تنظیمات عمومی allow-list؛ فقط رکوردهای isPublic=1 و فاقد هر داده داخلی/مدیر. */
export async function getPublicSettings() {
  const settings = await listPublicSystemSettings();

  return {
    settings: settings.map(mapPublicSetting),
  };
}
