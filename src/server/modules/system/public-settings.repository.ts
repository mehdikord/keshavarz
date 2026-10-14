import { prisma } from "@/server/db/prisma";

const publicSettingSelect = {
  description: true,
  settingGroup: true,
  settingKey: true,
  settingValue: true,
  updatedAt: true,
  valueType: true,
} as const;

export async function listPublicSystemSettings() {
  return prisma.systemSetting.findMany({
    where: { isPublic: 1 },
    orderBy: [{ settingGroup: "asc" }, { settingKey: "asc" }],
    select: publicSettingSelect,
  });
}
