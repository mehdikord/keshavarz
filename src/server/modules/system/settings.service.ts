import { prisma } from "@/server/db/prisma";
import {
  coerceStoredValue,
  findSettingDefinition,
  type SettingId,
  type SettingValueOf,
} from "@/server/modules/system/settings-registry";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; value: unknown }>();

/**
 * Reads an admin-editable setting. Falls back to the registry default when the
 * row is missing, unreadable or invalid — so a bad row can never break the app.
 * Cached briefly per process; `invalidateSettingsCache()` runs on every admin save.
 */
export async function getSetting<Id extends SettingId>(id: Id): Promise<SettingValueOf<Id>> {
  const [group, key] = id.split(".") as [string, string];
  const definition = findSettingDefinition(group, key);
  if (!definition) throw new Error(`Unknown setting ${id}`);

  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.value as SettingValueOf<Id>;

  let value: unknown = definition.default;
  try {
    const row = await prisma.systemSetting.findUnique({
      select: { settingValue: true },
      where: { settingGroup_settingKey: { settingGroup: group, settingKey: key } },
    });
    if (row) value = coerceStoredValue(definition, row.settingValue) ?? definition.default;
  } catch {
    // Settings must never take a request down; keep the default for this read.
    return definition.default as SettingValueOf<Id>;
  }

  cache.set(id, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value as SettingValueOf<Id>;
}

export function invalidateSettingsCache(): void {
  cache.clear();
}
