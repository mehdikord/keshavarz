import type { SystemSettingValueType } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

const settingSelect = {
  description: true,
  id: true,
  isPublic: true,
  settingGroup: true,
  settingKey: true,
  settingValue: true,
  updatedAt: true,
  updatedByAdminId: true,
  valueType: true,
  updatedByAdmin: {
    select: { publicId: true },
  },
} as const;

export async function listSystemSettings(input: { group?: string }) {
  return prisma.systemSetting.findMany({
    where: {
      ...(input.group ? { settingGroup: input.group } : {}),
    },
    orderBy: [{ settingGroup: "asc" }, { settingKey: "asc" }],
    select: settingSelect,
  });
}

export async function findSystemSetting(group: string, key: string) {
  return prisma.systemSetting.findUnique({
    where: {
      settingGroup_settingKey: {
        settingGroup: group,
        settingKey: key,
      },
    },
    select: settingSelect,
  });
}

export async function upsertSystemSetting(input: {
  description?: string | null;
  group: string;
  isPublic?: 0 | 1;
  key: string;
  settingValue: Prisma.InputJsonValue | unknown;
  updatedByAdminId: bigint;
  valueType: SystemSettingValueType;
}) {
  return prisma.systemSetting.upsert({
    where: {
      settingGroup_settingKey: {
        settingGroup: input.group,
        settingKey: input.key,
      },
    },
    create: {
      description: input.description ?? null,
      isPublic: input.isPublic ?? 0,
      settingGroup: input.group,
      settingKey: input.key,
      settingValue: input.settingValue as Prisma.InputJsonValue,
      updatedByAdminId: input.updatedByAdminId,
      valueType: input.valueType,
    },
    update: {
      description: input.description,
      ...(input.isPublic === undefined ? {} : { isPublic: input.isPublic }),
      settingValue: input.settingValue as Prisma.InputJsonValue,
      updatedByAdminId: input.updatedByAdminId,
      valueType: input.valueType,
    },
    select: settingSelect,
  });
}
