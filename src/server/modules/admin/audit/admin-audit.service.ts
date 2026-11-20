import type { NextRequest } from "next/server";

import type { TransactionClient } from "@/server/db/transaction";
import { getClientIp, getUserAgent } from "@/server/http";
import { insertAdminAuditLog } from "@/server/modules/admin/audit/admin-audit.repository";

const REDACTED_KEYS = /pass(word)?|token|secret|hash|otp|code_hash/i;

type JsonInput = string | number | boolean | null | JsonInput[] | { [key: string]: JsonInput };

/** Strips credentials and turns bigint/Date into JSON-safe values. */
function sanitize(value: unknown): JsonInput {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const output: Record<string, JsonInput> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = REDACTED_KEYS.test(key) ? "[REDACTED]" : sanitize(entry);
    }
    return output;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return String(value);
}

function toJson(value: unknown) {
  if (value === undefined) return undefined;
  const sanitized = sanitize(value);
  return sanitized === null ? undefined : sanitized;
}

export interface RecordAdminAuditInput {
  action: string;
  adminId: bigint | null;
  metadata?: Record<string, unknown>;
  module: string;
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  request?: NextRequest;
  subject?: { id: bigint; type: string };
}

export async function recordAdminAudit(
  input: RecordAdminAuditInput,
  transaction?: TransactionClient,
): Promise<void> {
  await insertAdminAuditLog(
    {
      action: input.action,
      adminId: input.adminId,
      auditableId: input.subject?.id ?? null,
      auditableType: input.subject?.type ?? null,
      httpMethod: input.request?.method ?? null,
      ipAddress: input.request ? getClientIp(input.request) : null,
      metadata: toJson(input.metadata),
      module: input.module,
      newValues: toJson(input.newValues),
      oldValues: toJson(input.oldValues),
      route: input.request?.nextUrl.pathname.slice(0, 255) ?? null,
      userAgent: input.request ? getUserAgent(input.request) : null,
    },
    transaction,
  );
}
