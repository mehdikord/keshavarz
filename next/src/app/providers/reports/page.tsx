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
import { BarChart3, CircleDollarSign, Trophy } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/shared/price-display";
import {
  getProviderCompletedCount,
  getProviderMonthlyChartData,
  getProviderMonthlyIncome,
  getProviderTotalIncome,
  getServiceLabel,
  getTopProviderService,
} from "@/lib/utils/provider-requests";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import { useRequestStore } from "@/stores/request-store";

export default function ProviderReportsPage() {
  const user = useAuthStore((state) => state.user);
  const requests = useRequestStore((state) => state.requests);

  if (!user) return null;

  const providerId = user.id;
  const totalIncome = getProviderTotalIncome(providerId, requests);
  const monthlyIncome = getProviderMonthlyIncome(providerId, requests);
  const completedCount = getProviderCompletedCount(providerId, requests);
  const chartData = getProviderMonthlyChartData(providerId, requests);
  const topService = getTopProviderService(providerId, requests);

  return (
    <PageContainer withDock>
      <PageHeader
        title="گزارشات"
        description="تحلیل درآمد و عملکرد"
      />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="درآمد کل"
          value={totalIncome > 0 ? `${Math.round(totalIncome / 1_000_000)}M` : "۰"}
          icon={CircleDollarSign}
        />
        <StatCard
          label="درآمد ماه"
          value={monthlyIncome > 0 ? `${Math.round(monthlyIncome / 1_000_000)}M` : "۰"}
          icon={BarChart3}
        />
      </div>

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="p-4">
          <p className="mb-1 text-sm font-semibold">کارهای انجام‌شده</p>
          <p className="text-3xl font-bold text-primary">
            {toPersianDigits(completedCount)}
          </p>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 overflow-hidden border-border/70">
        <CardContent className="p-4">
          <p className="mb-4 text-sm font-semibold">درآمد ۱۲ ماه اخیر</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8e2d8" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#5c6b5c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#5c6b5c" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => toPersianDigits(Math.round(value / 1_000_000))}
                />
                <Tooltip
                  formatter={(value) => formatPrice(Number(value))}
                  labelFormatter={(label) => String(label)}
                />
                <Bar
                  dataKey="amount"
                  fill="#2d6a4f"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topService ? (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">پردرآمدترین خدمت</p>
              <p className="font-semibold">
                {getServiceLabel(topService.serviceId)}
              </p>
              <PriceDisplay amount={topService.amount} size="sm" />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
