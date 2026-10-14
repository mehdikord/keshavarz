import * as z from "zod";

import { IsoUtcDateTimeSchema, PublicIdSchema } from "@/server/contracts";

export const REPORTS_TIMEZONE = "Asia/Tehran" as const;

export const ReportRangeQuerySchema = z
  .object({
    from: IsoUtcDateTimeSchema.optional(),
    to: IsoUtcDateTimeSchema.optional(),
  })
  .strict();

export const ConsumerFinancialSummaryQuerySchema = ReportRangeQuerySchema.extend({
  landId: PublicIdSchema.optional(),
});

export const ConsumerMonthlyCostsQuerySchema = z
  .object({
    landId: PublicIdSchema.optional(),
    year: z.coerce.number<number>().int().min(2000).max(2100).optional(),
  })
  .strict();

export const ProviderFinancialSummaryQuerySchema = ReportRangeQuerySchema.extend({
  serviceId: z.string().trim().min(1).max(170).optional(),
});

export const ProviderMonthlyRevenueQuerySchema = ReportRangeQuerySchema.strict();

export const AdminReportsQuerySchema = ReportRangeQuerySchema;
