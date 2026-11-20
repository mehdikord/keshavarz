import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";

export interface AdminAuditRow {
  action: string;
  adminId: bigint | null;
  auditableId: bigint | null;
  auditableType: string | null;
  httpMethod: string | null;
  ipAddress: string | null;
  metadata: Prisma.InputJsonValue | undefined;
  module: string;
  newValues: Prisma.InputJsonValue | undefined;
  oldValues: Prisma.InputJsonValue | undefined;
  route: string | null;
  userAgent: string | null;
}

export async function insertAdminAuditLog(
  row: AdminAuditRow,
  transaction?: TransactionClient,
): Promise<void> {
  await (transaction ?? prisma).adminAuditLog.create({ data: row });
}

export async function listAuditLogsForSubject(
  auditableType: string,
  auditableId: bigint,
  limit: number,
) {
  return prisma.adminAuditLog.findMany({
    where: { auditableId, auditableType },
    orderBy: { id: "desc" },
    take: limit,
    select: {
      action: true,
      admin: { select: { name: true, publicId: true } },
      createdAt: true,
      id: true,
      ipAddress: true,
      metadata: true,
      module: true,
      newValues: true,
      oldValues: true,
    },
  });
}
