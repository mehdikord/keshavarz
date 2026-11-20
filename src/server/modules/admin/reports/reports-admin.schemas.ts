import * as z from "zod";

export const REPORT_TABS = ["growth", "marketplace", "revenue", "providers"] as const;
export type ReportTab = (typeof REPORT_TABS)[number];

export const REPORT_DATASETS = [
  "growth-summary",
  "growth-series",
  "growth-provinces",
  "marketplace-summary",
  "marketplace-series",
  "marketplace-services",
  "marketplace-categories",
  "marketplace-provinces",
  "revenue-summary",
  "revenue-series",
  "revenue-plans",
  "providers-summary",
  "providers-leaderboard",
] as const;
export type ReportDataset = (typeof REPORT_DATASETS)[number];

const optionalText = z.string().trim().max(20).optional().catch(undefined);

/** Page/URL parameters: everything falls back instead of failing the page. */
export const ReportsQuerySchema = z.object({
  from: optionalText,
  period: optionalText,
  tab: z.enum(REPORT_TABS).catch("growth"),
  to: optionalText,
});
export type ReportsQuery = z.infer<typeof ReportsQuerySchema>;

export const ReportExportQuerySchema = z.object({
  dataset: z.enum(REPORT_DATASETS, { message: "نوع خروجی معتبر نیست." }),
  from: z.string().trim().max(20).optional(),
  period: z.string().trim().max(20).optional(),
  to: z.string().trim().max(20).optional(),
});
