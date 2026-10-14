import * as z from "zod";

import { adminApi } from "@/lib/api/admin-client";

export const REQUEST_STATUS_LABELS = {
  pending_provider: "در انتظار Provider",
  in_progress: "در حال انجام",
  completed: "اتمام",
  cancelled: "لغو شده",
} as const;

export type DashboardRequestStatus = keyof typeof REQUEST_STATUS_LABELS;

export const AdminDashboardKpisSchema = z
  .object({
    activeUsers: z.number().int().nonnegative(),
    approvedProviders: z.number().int().nonnegative(),
    availableProviders: z.number().int().nonnegative(),
    from: z.string().min(1),
    notificationDeliveryFailuresCount: z.number().int().nonnegative(),
    paymentFailuresCount: z.number().int().nonnegative(),
    requestsByStatus: z.object({
      cancelled: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
      in_progress: z.number().int().nonnegative(),
      pending_provider: z.number().int().nonnegative(),
    }),
    subscriptionRevenuePaidToman: z.number().nonnegative(),
    timezone: z.literal("Asia/Tehran"),
    to: z.string().min(1),
    totalProviders: z.number().int().nonnegative(),
    totalUsers: z.number().int().nonnegative(),
  })
  .strict();

export type AdminDashboardKpis = z.infer<typeof AdminDashboardKpisSchema>;

export const AdminMetricsSchema = z
  .object({
    metrics: z.record(z.string(), z.number()),
    scrapedAt: z.string().min(1),
  })
  .strict();

export type AdminMetrics = z.infer<typeof AdminMetricsSchema>;

export const AdminHealthSchema = z
  .object({
    actorId: z.string().min(1),
    realm: z.literal("admins"),
  })
  .strict();

export type AdminHealth = z.infer<typeof AdminHealthSchema>;

export type DashboardRangePreset = "7d" | "30d" | "90d";

export function dashboardRangeFromPreset(
  preset: DashboardRangePreset,
  now = new Date(),
): { from: string; to: string } {
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const to = now;
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function detectDashboardPreset(
  from?: string | null,
  to?: string | null,
): DashboardRangePreset | "custom" {
  if (!from || !to) return "30d";
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) return "custom";
  const days = Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
  if (days === 7) return "7d";
  if (days === 30) return "30d";
  if (days === 90) return "90d";
  return "custom";
}

export async function fetchAdminDashboard(input: {
  from?: string;
  to?: string;
  signal?: AbortSignal;
}): Promise<AdminDashboardKpis> {
  const result = await adminApi.get<unknown>("/dashboard", {
    query: {
      from: input.from,
      to: input.to,
    },
    signal: input.signal,
  });
  return AdminDashboardKpisSchema.parse(result.data);
}

export async function fetchAdminMetrics(
  signal?: AbortSignal,
): Promise<AdminMetrics> {
  const result = await adminApi.get<unknown>("/metrics", { signal });
  return AdminMetricsSchema.parse(result.data);
}

export async function fetchAdminHealth(
  signal?: AbortSignal,
): Promise<AdminHealth> {
  const result = await adminApi.get<unknown>("/health/authenticated", {
    signal,
  });
  return AdminHealthSchema.parse(result.data);
}

export function formatDashboardDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(iso));
}

export function formatCompactToman(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 1,
    }).format(amount / 1_000_000_000)} میلیارد`;
  }
  if (amount >= 1_000_000) {
    return `${new Intl.NumberFormat("fa-IR", {
      maximumFractionDigits: 1,
    }).format(amount / 1_000_000)} میلیون`;
  }
  return new Intl.NumberFormat("fa-IR").format(amount);
}
