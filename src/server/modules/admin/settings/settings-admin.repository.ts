import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";

type Db = TransactionClient | typeof prisma;

export async function listSettingRows() {
  return prisma.systemSetting.findMany({
    orderBy: [{ settingGroup: "asc" }, { settingKey: "asc" }],
    select: {
      description: true,
      id: true,
      isPublic: true,
      settingGroup: true,
      settingKey: true,
      settingValue: true,
      updatedAt: true,
      updatedByAdmin: { select: { name: true } },
      valueType: true,
    },
  });
}

export async function findSettingRow(db: Db, group: string, key: string) {
  return db.systemSetting.findUnique({
    select: { id: true, settingValue: true },
    where: { settingGroup_settingKey: { settingGroup: group, settingKey: key } },
  });
}

export async function upsertSettingRow(
  db: Db,
  input: {
    adminId: bigint;
    description: string;
    group: string;
    isPublic: boolean;
    key: string;
    value: Prisma.InputJsonValue;
    valueType: "string" | "integer" | "boolean";
  },
) {
  const data = {
    description: input.description,
    isPublic: input.isPublic ? 1 : 0,
    settingValue: input.value,
    updatedAt: new Date(),
    updatedByAdminId: input.adminId,
    valueType: input.valueType,
  };
  return db.systemSetting.upsert({
    create: { ...data, settingGroup: input.group, settingKey: input.key },
    update: data,
    where: { settingGroup_settingKey: { settingGroup: input.group, settingKey: input.key } },
  });
}

export async function deleteSettingRow(db: Db, id: bigint) {
  await db.systemSetting.delete({ where: { id } });
}

export async function pingDatabase(): Promise<{ latencyMs: number; version: string | null }> {
  const started = performance.now();
  const rows = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() AS version`;
  return { latencyMs: Math.round((performance.now() - started) * 10) / 10, version: rows[0]?.version ?? null };
}

export async function listJobRunRows() {
  return prisma.jobRun.findMany({ orderBy: { jobName: "asc" } });
}

export async function countDeliveriesByStatus() {
  const rows = await prisma.notificationDelivery.groupBy({
    _count: { _all: true },
    by: ["channel", "status"],
  });
  const oldestQueued = await prisma.notificationDelivery.findFirst({
    orderBy: { queuedAt: "asc" },
    select: { queuedAt: true },
    where: { status: "queued" },
  });
  return { oldestQueuedAt: oldestQueued?.queuedAt ?? null, rows };
}
