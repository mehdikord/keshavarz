"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import type { AdminReportsFinancial } from "@/lib/api/admin-reports";
import { formatCompactToman } from "@/lib/api/admin-dashboard";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

interface AdminMonthlyGmvChartProps {
  monthlyGmv: AdminReportsFinancial["monthlyGmv"];
}

export function AdminMonthlyGmvChart({ monthlyGmv }: AdminMonthlyGmvChartProps) {
  const chartData = monthlyGmv.map((row) => ({
    label: `${toPersianDigits(row.year)}/${toPersianDigits(row.month)}`,
    totalToman: row.totalToman,
    count: row.count,
  }));

  return (
    <AdminSectionCard className="h-full">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">GMV ماهانه</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          مقادیر مستقیم از گزارش مالی API
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-[var(--admin-border)] bg-muted/20 text-sm text-muted-foreground">
          داده‌ای برای این بازه نیست.
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
                tick={{ fontSize: 11, fill: "#5c6b5c" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(value) => formatCompactToman(Number(value))}
              />
              <Tooltip
                cursor={{ fill: "rgba(45, 106, 79, 0.06)" }}
                contentStyle={{
                  borderRadius: 12,
                  borderColor: "#dde3da",
                  fontSize: 12,
                }}
                formatter={(value) => [formatPrice(Number(value ?? 0)), "GMV"]}
              />
              <Bar
                dataKey="totalToman"
                fill="#2d6a4f"
                radius={[8, 8, 4, 4]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </AdminSectionCard>
  );
}
