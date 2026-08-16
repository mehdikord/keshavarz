import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { EXPORT_TTL_MS } from "@/server/modules/exports/exports.schemas";

export type ExportDomain = "payments" | "reports";
export type ExportStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "expired";

export interface ExportJob {
  adminId: bigint;
  adminPublicId: string;
  createdAt: Date;
  domain: ExportDomain;
  errorMessage: string | null;
  expiresAt: Date;
  exportId: string;
  filePath: string | null;
  filters: {
    from?: string;
    status?: string;
    to?: string;
  };
  rowCount: number | null;
  status: ExportStatus;
  truncated: boolean;
}

const store = new Map<string, ExportJob>();

export function getExportsDirectory(): string {
  const directory = join(tmpdir(), "keshavarz-exports");
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function createExportJob(input: {
  adminId: bigint;
  adminPublicId: string;
  domain: ExportDomain;
  exportId: string;
  filters: ExportJob["filters"];
  now: Date;
}): ExportJob {
  pruneExpiredExportJobs(input.now);
  const job: ExportJob = {
    adminId: input.adminId,
    adminPublicId: input.adminPublicId,
    createdAt: input.now,
    domain: input.domain,
    errorMessage: null,
    expiresAt: new Date(input.now.getTime() + EXPORT_TTL_MS),
    exportId: input.exportId,
    filePath: null,
    filters: input.filters,
    rowCount: null,
    status: "queued",
    truncated: false,
  };
  store.set(job.exportId, job);
  return job;
}

export function getExportJob(exportId: string): ExportJob | null {
  return store.get(exportId) ?? null;
}

export function updateExportJob(
  exportId: string,
  patch: Partial<
    Pick<
      ExportJob,
      | "errorMessage"
      | "filePath"
      | "rowCount"
      | "status"
      | "truncated"
    >
  >,
): ExportJob | null {
  const existing = store.get(exportId);
  if (!existing) {
    return null;
  }
  const updated = { ...existing, ...patch };
  store.set(exportId, updated);
  return updated;
}

export function listExportJobs(): ExportJob[] {
  return [...store.values()];
}

export function deleteExportJob(exportId: string): void {
  store.delete(exportId);
}

export function pruneExpiredExportJobs(now: Date): ExportJob[] {
  const expired: ExportJob[] = [];
  for (const [key, job] of store) {
    if (job.expiresAt <= now || job.status === "expired") {
      expired.push(job);
      store.delete(key);
    }
  }
  return expired;
}

export function clearExportStoreForTests(): void {
  store.clear();
}
