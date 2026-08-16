import { prisma } from "@/server/db/prisma";
import { redactAuditValue } from "@/server/modules/admin-audit/admin-audit.redaction";

const auditLogSelect = {
  action: true,
  adminId: true,
  auditableId: true,
  auditableType: true,
  createdAt: true,
  httpMethod: true,
  id: true,
  ipAddress: true,
  metadata: true,
  module: true,
  newValues: true,
  oldValues: true,
  route: true,
  userAgent: true,
  admin: {
    select: {
      publicId: true,
    },
  },
} as const;

export async function insertAdminAuditLog(input: {
  action: string;
  adminId: bigint | null;
  auditableId?: bigint | null;
  auditableType?: string | null;
  httpMethod?: string | null;
  ipAddress?: string | null;
  metadata?: unknown;
  module: string;
  newValues?: unknown;
  oldValues?: unknown;
  route?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      action: input.action,
      adminId: input.adminId,
      auditableId: input.auditableId ?? null,
      auditableType: input.auditableType ?? null,
      httpMethod: input.httpMethod ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata
        ? (redactAuditValue(input.metadata) as object)
        : undefined,
      module: input.module,
      newValues: input.newValues
        ? (redactAuditValue(input.newValues) as object)
        : undefined,
      oldValues: input.oldValues
        ? (redactAuditValue(input.oldValues) as object)
        : undefined,
      route: input.route ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function findAdminInternalIdByPublicId(publicId: string) {
  return prisma.admin.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function listAdminAuditLogs(input: {
  action?: string;
  adminId?: bigint;
  cursorId?: bigint;
  from?: Date;
  limit: number;
  module?: string;
  to?: Date;
}) {
  return prisma.adminAuditLog.findMany({
    where: {
      ...(input.action ? { action: input.action } : {}),
      ...(input.adminId ? { adminId: input.adminId } : {}),
      ...(input.module ? { module: input.module } : {}),
      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: auditLogSelect,
  });
}

export async function findAdminAuditLogById(id: bigint) {
  return prisma.adminAuditLog.findUnique({
    where: { id },
    select: auditLogSelect,
  });
}
