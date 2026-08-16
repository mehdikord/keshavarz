"use client";

import { useEffect, useState } from "react";
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
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/shared/price-display";
import {
  fetchProviderFinancialSummary,
  fetchProviderMonthlyRevenue,
  type AppProviderFinancialSummary,
  type AppProviderMonthlyRevenue,
} from "@/lib/api/app-reports";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

function formatCompactToman(amount: number): string {
  if (amount <= 0) return "۰";
  if (amount >= 1_000_000) {
    return `${toPersianDigits(Math.round(amount / 1_000_000))}M`;
  }
  return `${toPersianDigits(Math.round(amount / 1000))}K`;
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("fa-IR", { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
}

export default function ProviderReportsPage() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState<AppProviderFinancialSummary | null>(
    null,
  );
  const [monthRevenueToman, setMonthRevenueToman] = useState(0);
  const [monthly, setMonthly] = useState<AppProviderMonthlyRevenue | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    void Promise.all([
      fetchProviderFinancialSummary({ signal: controller.signal }),
      fetchProviderMonthlyRevenue({ signal: controller.signal }),
      fetchProviderFinancialSummary({
        from: monthStart.toISOString(),
        signal: controller.signal,
        to: nextMonth.toISOString(),
      }),
    ])
      .then(([rangeSummary, monthlyRevenue, monthSummary]) => {
        if (controller.signal.aborted) return;
        setSummary(rangeSummary);
        setMonthly(monthlyRevenue);
        setMonthRevenueToman(monthSummary.totalRevenueToman);
        setNeedsProfile(false);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (isApiClientError(cause) && cause.status === 404) {
          setNeedsProfile(true);
          setError(null);
          return;
        }
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری گزارش‌ها ناموفق بود",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  if (!user) return null;

  if (loading && !summary) {
    return (
      <PageContainer withDock>
        <PageHeader title="گزارشات" description="تحلیل درآمد و عملکرد" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

  if (needsProfile) {
    return (
      <PageContainer withDock>
        <PageHeader title="گزارشات" description="تحلیل درآمد و عملکرد" />
        <EmptyState
          icon={CircleDollarSign}
          title="پروفایل خدمات‌دهنده تکمیل نشده"
          description="پس از تنظیم پروفایل و خدمات، گزارش درآمد در دسترس است."
          action={{ label: "تنظیم خدمات", href: "/providers/services" }}
        />
      </PageContainer>
    );
  }

  if (error && !summary) {
    return (
      <PageContainer withDock>
        <PageHeader title="گزارشات" description="تحلیل درآمد و عملکرد" />
        <EmptyState
          icon={CircleDollarSign}
          title="خطا در بارگذاری"
          description={error}
        />
      </PageContainer>
    );
  }

  const chartData =
    monthly?.months.map((row) => ({
      amount: row.totalToman,
      month: monthLabel(row.year, row.month),
    })) ?? [];

  const topService = summary?.topService ?? null;

  return (
    <PageContainer withDock>
      <PageHeader title="گزارشات" description="تحلیل درآمد و عملکرد" />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="درآمد کل بازه"
          value={formatCompactToman(summary?.totalRevenueToman ?? 0)}
          icon={CircleDollarSign}
        />
        <StatCard
          label="درآمد ماه"
          value={formatCompactToman(monthRevenueToman)}
          icon={BarChart3}
        />
      </div>

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="p-4">
          <p className="mb-1 text-sm font-semibold">کارهای انجام‌شده</p>
          <p className="text-3xl font-bold text-primary">
            {toPersianDigits(summary?.completedCount ?? 0)}
          </p>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 overflow-hidden border-border/70">
        <CardContent className="p-4">
          <p className="mb-4 text-sm font-semibold">درآمد ۱۲ ماه اخیر</p>
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#d8e2d8"
                  />
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
                    tickFormatter={(value) =>
                      toPersianDigits(Math.round(Number(value) / 1_000_000))
                    }
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
          )}
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
              <p className="font-semibold">{topService.name}</p>
              <PriceDisplay amount={topService.totalToman} size="sm" />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
