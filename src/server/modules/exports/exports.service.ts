import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { systemClock } from "@/server/clock/clock";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import { toCsv } from "@/server/modules/exports/exports.csv";
import {
  listPaymentsForExport,
  listReportsForExport,
} from "@/server/modules/exports/exports.repository";
import { createExportDownloadToken } from "@/server/modules/exports/exports.signing";
import {
  createExportJob,
  deleteExportJob,
  getExportJob,
  getExportsDirectory,
  pruneExpiredExportJobs,
  updateExportJob,
  type ExportDomain,
  type ExportJob,
} from "@/server/modules/exports/exports.store";

function mapJobStatus(job: ExportJob, adminPublicId: string) {
  const base = {
    createdAt: job.createdAt.toISOString(),
    domain: job.domain,
    errorMessage: job.errorMessage,
    expiresAt: job.expiresAt.toISOString(),
    exportId: job.exportId,
    rowCount: job.rowCount,
    status: job.status,
    truncated: job.truncated,
  };

  if (job.status !== "ready" || !job.filePath) {
    return base;
  }

  const signed = createExportDownloadToken({
    adminId: adminPublicId,
    exportId: job.exportId,
  });

  return {
    ...base,
    downloadExpiresAt: signed.expiresAt.toISOString(),
    downloadUrl: `/api/admins/v1/exports/${job.exportId}?downloadToken=${encodeURIComponent(signed.token)}`,
  };
}

export async function processExportJob(exportId: string): Promise<void> {
  const job = getExportJob(exportId);
  if (!job || job.status === "ready" || job.status === "failed") {
    return;
  }

  updateExportJob(exportId, { status: "processing" });

  try {
    const dataset =
      job.domain === "payments"
        ? await listPaymentsForExport(job.filters)
        : await listReportsForExport(job.filters);

    const directory = getExportsDirectory();
    await mkdir(directory, { recursive: true });
    const filePath = join(directory, `${exportId}.csv`);
    await writeFile(filePath, toCsv(dataset.rows), "utf8");

    updateExportJob(exportId, {
      filePath,
      rowCount: dataset.rows.length,
      status: "ready",
      truncated: dataset.truncated,
    });
  } catch (error) {
    updateExportJob(exportId, {
      errorMessage:
        error instanceof Error ? error.message.slice(0, 500) : "export_failed",
      status: "failed",
    });
  }
}

export async function createAdminExport(input: {
  adminId: bigint;
  adminPublicId: string;
  domain: ExportDomain;
  filters: {
    from?: string;
    status?: string;
    to?: string;
  };
}) {
  const now = systemClock.now();
  const exportId = createPublicId();
  const job = createExportJob({
    adminId: input.adminId,
    adminPublicId: input.adminPublicId,
    domain: input.domain,
    exportId,
    filters: input.filters,
    now,
  });

  void processExportJob(exportId);

  return {
    domain: job.domain,
    expiresAt: job.expiresAt.toISOString(),
    exportId: job.exportId,
    status: job.status,
  };
}

export async function getAdminExport(input: {
  adminPublicId: string;
  exportId: string;
}) {
  const job = getExportJob(input.exportId);
  if (!job) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خروجی یافت نشد.");
  }
  if (job.expiresAt <= systemClock.now()) {
    throw new ApiError(410, API_ERROR_CODES.notFound, "خروجی منقضی شده است.");
  }
  return mapJobStatus(job, input.adminPublicId);
}

export function getExportFilePathForDownload(input: {
  adminPublicId: string;
  exportId: string;
}): { fileName: string; filePath: string } {
  const job = getExportJob(input.exportId);
  if (!job || !job.filePath || job.status !== "ready") {
    throw new ApiError(404, API_ERROR_CODES.notFound, "فایل خروجی آماده نیست.");
  }
  if (job.expiresAt <= systemClock.now()) {
    throw new ApiError(410, API_ERROR_CODES.notFound, "خروجی منقضی شده است.");
  }
  return {
    fileName: `${job.domain}-${job.exportId}.csv`,
    filePath: job.filePath,
  };
}

export async function cleanupExpiredExports() {
  const now = systemClock.now();
  const expired = pruneExpiredExportJobs(now);
  let deletedFiles = 0;
  for (const job of expired) {
    if (job.filePath) {
      try {
        await unlink(job.filePath);
        deletedFiles += 1;
      } catch {
        // ignore missing files
      }
    }
    deleteExportJob(job.exportId);
  }
  return {
    deletedFiles,
    expiredJobs: expired.length,
    ranAt: now.toISOString(),
  };
}
