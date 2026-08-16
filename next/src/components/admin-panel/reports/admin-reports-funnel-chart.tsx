"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import {
  REQUEST_STATUS_LABELS,
  type DashboardRequestStatus,
} from "@/lib/api/admin-dashboard";
import { toPersianDigits } from "@/lib/utils/format";

const STATUS_COLORS: Record<DashboardRequestStatus, string> = {
  pending_provider: "#f4a261",
  in_progress: "#2d6a4f",
  completed: "#40916c",
  cancelled: "#8b7355",
};

interface AdminReportsFunnelChartProps {
  funnel: Record<DashboardRequestStatus, number>;
}

export function AdminReportsFunnelChart({ funnel }: AdminReportsFunnelChartProps) {
  const chartData = (
    Object.keys(REQUEST_STATUS_LABELS) as DashboardRequestStatus[]
  ).map((status) => ({
    key: status,
    label: REQUEST_STATUS_LABELS[status],
    value: funnel[status],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminSectionCard className="h-full">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">قیف درخواست‌ها</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            توزیع وضعیت‌ها طبق پاسخ API
          </p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          مجموع {toPersianDigits(total)}
        </span>
      </div>

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--admin-border)] bg-muted/20 text-sm text-muted-foreground">
          در این بازه درخواستی ثبت نشده است.
        </div>
      ) : (
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ebe4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#5c6b5c" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#5c6b5c" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ fill: "rgba(45, 106, 79, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#dde3da",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  toPersianDigits(Number(value ?? 0)),
                  "تعداد",
                ]}
              />
              <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={48}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminSectionCard>
  );
}
