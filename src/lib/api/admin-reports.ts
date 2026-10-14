import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";

export const REPORTS_TIMEZONE = "Asia/Tehran" as const;

const FunnelSchema = z
  .object({
    cancelled: z.number().int(),
    completed: z.number().int(),
    in_progress: z.number().int(),
    pending_provider: z.number().int(),
  })
  .strict();

export const AdminReportsOverviewSchema = z
  .object({
    activeProviders: z.number().int(),
    activeUsers: z.number().int(),
    from: z.string(),
    funnel: FunnelSchema,
    gmvToman: z.number().int(),
    notificationDeliveryFailureRate: z.number(),
    paymentFailureRate: z.number(),
    refundsSucceededToman: z.number().int(),
    subscriptionRevenuePaidToman: z.number().int(),
    timezone: z.literal(REPORTS_TIMEZONE),
    to: z.string(),
  })
  .strict();

export const AdminFinancialTopServiceSchema = z
  .object({
    name: z.string(),
    serviceId: z.string(),
    totalToman: z.number().int(),
  })
  .strict();

export const AdminFinancialMonthlyGmvSchema = z
  .object({
    count: z.number().int(),
    month: z.number().int(),
    totalToman: z.number().int(),
    year: z.number().int(),
  })
  .strict();

export const AdminReportsFinancialSchema = z
  .object({
    averageTicketToman: z.number().int(),
    completedCount: z.number().int(),
    from: z.string(),
    gmvToman: z.number().int(),
    monthlyGmv: z.array(AdminFinancialMonthlyGmvSchema),
    payments: z
      .object({
        failedAmountToman: z.number().int(),
        failedCount: z.number().int(),
        paidAmountToman: z.number().int(),
        refundedAmountToman: z.number().int(),
      })
      .strict(),
    timezone: z.literal(REPORTS_TIMEZONE),
    to: z.string(),
    topServices: z.array(AdminFinancialTopServiceSchema),
  })
  .strict();

export type AdminReportsOverview = z.infer<typeof AdminReportsOverviewSchema>;
export type AdminReportsFinancial = z.infer<typeof AdminReportsFinancialSchema>;

export async function fetchAdminReportsOverview(input: {
  from?: string;
  to?: string;
  signal?: AbortSignal;
}): Promise<AdminReportsOverview> {
  const result = await adminApi.get<unknown>("/reports/overview", {
    query: { from: input.from, to: input.to },
    signal: input.signal,
  });
  return AdminReportsOverviewSchema.parse(result.data);
}

export async function fetchAdminReportsFinancial(input: {
  from?: string;
  to?: string;
  signal?: AbortSignal;
}): Promise<AdminReportsFinancial> {
  const result = await adminApi.get<unknown>("/reports/financial", {
    query: { from: input.from, to: input.to },
    signal: input.signal,
  });
  return AdminReportsFinancialSchema.parse(result.data);
}

export function formatReportRate(rate: number): string {
  return new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(rate);
}
