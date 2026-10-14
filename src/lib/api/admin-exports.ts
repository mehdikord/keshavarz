import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";
import { PAYMENT_STATUSES } from "@/lib/api/admin-payments";

export const EXPORT_DOMAINS = ["payments", "reports"] as const;
export type AdminExportDomain = (typeof EXPORT_DOMAINS)[number];

export const EXPORT_STATUSES = [
  "queued",
  "processing",
  "ready",
  "failed",
] as const;

export const AdminExportJobSchema = z
  .object({
    createdAt: z.string().optional(),
    domain: z.enum(EXPORT_DOMAINS),
    downloadExpiresAt: z.string().optional(),
    downloadUrl: z.string().optional(),
    errorMessage: z.string().nullable().optional(),
    expiresAt: z.string(),
    exportId: z.string(),
    rowCount: z.number().int().nullable().optional(),
    status: z.string(),
    truncated: z.boolean().optional(),
  })
  .passthrough();

export type AdminExportJob = z.infer<typeof AdminExportJobSchema>;

export async function createAdminExport(input: {
  domain: AdminExportDomain;
  filters?: {
    from?: string;
    status?: (typeof PAYMENT_STATUSES)[number];
    to?: string;
  };
}): Promise<AdminExportJob> {
  const result = await adminApi.post<unknown>("/exports", {
    domain: input.domain,
    filters: input.filters ?? {},
    format: "csv",
  });
  return AdminExportJobSchema.parse(result.data);
}

export async function fetchAdminExport(
  exportId: string,
  signal?: AbortSignal,
): Promise<AdminExportJob> {
  const result = await adminApi.get<unknown>(`/exports/${exportId}`, { signal });
  return AdminExportJobSchema.parse(result.data);
}
