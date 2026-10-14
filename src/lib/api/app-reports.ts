import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

const TopNamedSchema = z
  .object({
    name: z.string(),
    serviceId: z.string().optional(),
    totalToman: z.number().int(),
  })
  .passthrough();

const TopLandSchema = z
  .object({
    landId: z.string(),
    title: z.string(),
    totalToman: z.number().int(),
  })
  .strict();

export const AppConsumerFinancialSummarySchema = z
  .object({
    completedCount: z.number().int(),
    from: z.string(),
    timezone: z.string(),
    to: z.string(),
    topLand: TopLandSchema.nullable().optional(),
    topService: TopNamedSchema.nullable().optional(),
    totalCostToman: z.number().int(),
  })
  .passthrough();

export type AppConsumerFinancialSummary = z.infer<
  typeof AppConsumerFinancialSummarySchema
>;

export const AppConsumerMonthlyCostsSchema = z
  .object({
    months: z.array(
      z
        .object({
          count: z.number().int(),
          month: z.number().int(),
          totalToman: z.number().int(),
        })
        .strict(),
    ),
    timezone: z.string(),
    year: z.number().int(),
  })
  .strict();

export type AppConsumerMonthlyCosts = z.infer<
  typeof AppConsumerMonthlyCostsSchema
>;

export const AppProviderFinancialSummarySchema = z
  .object({
    annualRevenueToman: z.number().int(),
    completedCount: z.number().int(),
    from: z.string(),
    timezone: z.string(),
    to: z.string(),
    topService: TopNamedSchema.nullable().optional(),
    totalRevenueToman: z.number().int(),
  })
  .passthrough();

export type AppProviderFinancialSummary = z.infer<
  typeof AppProviderFinancialSummarySchema
>;

export const AppProviderMonthlyRevenueSchema = z
  .object({
    from: z.string(),
    months: z.array(
      z
        .object({
          count: z.number().int(),
          month: z.number().int(),
          totalToman: z.number().int(),
          year: z.number().int(),
        })
        .strict(),
    ),
    timezone: z.string(),
    to: z.string(),
  })
  .strict();

export type AppProviderMonthlyRevenue = z.infer<
  typeof AppProviderMonthlyRevenueSchema
>;

export async function fetchConsumerFinancialSummary(input?: {
  from?: string;
  landId?: string;
  signal?: AbortSignal;
  to?: string;
}): Promise<AppConsumerFinancialSummary> {
  const result = await appApi.get<unknown>(
    "/consumer/reports/financial-summary",
    {
      query: {
        from: input?.from,
        landId: input?.landId,
        to: input?.to,
      },
      signal: input?.signal,
    },
  );
  return AppConsumerFinancialSummarySchema.parse(result.data);
}

export async function fetchConsumerMonthlyCosts(input?: {
  landId?: string;
  signal?: AbortSignal;
  year?: number;
}): Promise<AppConsumerMonthlyCosts> {
  const result = await appApi.get<unknown>("/consumer/reports/monthly-costs", {
    query: {
      landId: input?.landId,
      year: input?.year,
    },
    signal: input?.signal,
  });
  return AppConsumerMonthlyCostsSchema.parse(result.data);
}

export async function fetchProviderFinancialSummary(input?: {
  from?: string;
  serviceId?: string;
  signal?: AbortSignal;
  to?: string;
}): Promise<AppProviderFinancialSummary> {
  const result = await appApi.get<unknown>(
    "/provider/reports/financial-summary",
    {
      query: {
        from: input?.from,
        serviceId: input?.serviceId,
        to: input?.to,
      },
      signal: input?.signal,
    },
  );
  return AppProviderFinancialSummarySchema.parse(result.data);
}

export async function fetchProviderMonthlyRevenue(input?: {
  from?: string;
  signal?: AbortSignal;
  to?: string;
}): Promise<AppProviderMonthlyRevenue> {
  const result = await appApi.get<unknown>(
    "/provider/reports/monthly-revenue",
    {
      query: {
        from: input?.from,
        to: input?.to,
      },
      signal: input?.signal,
    },
  );
  return AppProviderMonthlyRevenueSchema.parse(result.data);
}
