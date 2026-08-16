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
import { MapPin, PieChart, Receipt, Wallet } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatCard } from "@/components/shared/stat-card";
import { PriceDisplay } from "@/components/shared/price-display";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAppLands, type AppLand } from "@/lib/api/app-lands";
import {
  fetchConsumerFinancialSummary,
  fetchConsumerMonthlyCosts,
  type AppConsumerFinancialSummary,
  type AppConsumerMonthlyCosts,
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

export default function ConsumerReportsPage() {
  const user = useAuthStore((state) => state.user);
  const [landFilter, setLandFilter] = useState<string>("all");
  const [lands, setLands] = useState<AppLand[]>([]);
  const [summary, setSummary] = useState<AppConsumerFinancialSummary | null>(
    null,
  );
  const [monthCostToman, setMonthCostToman] = useState(0);
  const [monthly, setMonthly] = useState<AppConsumerMonthlyCosts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    void fetchAppLands({ limit: 50, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setLands(result.items);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLands([]);
      });

    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const landId = landFilter === "all" ? undefined : landFilter;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    void Promise.all([
      fetchConsumerFinancialSummary({
        landId,
        signal: controller.signal,
      }),
      fetchConsumerMonthlyCosts({
        landId,
        signal: controller.signal,
        year: now.getFullYear(),
      }),
      fetchConsumerFinancialSummary({
        from: monthStart.toISOString(),
        landId,
        signal: controller.signal,
        to: nextMonth.toISOString(),
      }),
    ])
      .then(([yearSummary, monthlyCosts, monthSummary]) => {
        if (controller.signal.aborted) return;
        setSummary(yearSummary);
        setMonthly(monthlyCosts);
        setMonthCostToman(monthSummary.totalCostToman);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
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
  }, [user, landFilter]);

  if (!user) return null;

  if (loading && !summary) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="گزارشات مالی"
          description="تحلیل هزینه‌های خدمات دریافتی"
        />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

  if (error && !summary) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="گزارشات مالی"
          description="تحلیل هزینه‌های خدمات دریافتی"
        />
        <EmptyState
          icon={Wallet}
          title="خطا در بارگذاری"
          description={error}
        />
      </PageContainer>
    );
  }

  const chartData =
    monthly?.months.map((row) => ({
      amount: row.totalToman,
      month: monthLabel(monthly.year, row.month),
    })) ?? [];

  const topExpense = summary?.topService ?? null;
  const topLand = summary?.topLand ?? null;

  return (
    <PageContainer withDock>
      <PageHeader
        title="گزارشات مالی"
        description="تحلیل هزینه‌های خدمات دریافتی"
      />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="هزینه کل بازه"
          value={formatCompactToman(summary?.totalCostToman ?? 0)}
          icon={Wallet}
        />
        <StatCard
          label="هزینه ماه"
          value={formatCompactToman(monthCostToman)}
          icon={Receipt}
        />
      </div>

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="p-4">
          <p className="mb-1 text-sm font-semibold">خدمات دریافت‌شده</p>
          <p className="text-3xl font-bold text-accent">
            {toPersianDigits(summary?.completedCount ?? 0)}
          </p>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 overflow-hidden border-border/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-accent" />
              <p className="text-sm font-semibold">
                هزینه سال{" "}
                {toPersianDigits(monthly?.year ?? new Date().getFullYear())}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="sr-only">فیلتر زمین</Label>
              <Select value={landFilter} onValueChange={setLandFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه زمین‌ها</SelectItem>
                  {lands.map((land) => (
                    <SelectItem key={land.landId} value={land.landId}>
                      {land.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    stroke="#f0e4d8"
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
                    fill="#f4a261"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {topExpense ? (
        <Card className="mb-4 overflow-hidden border-accent/25 bg-gradient-to-l from-accent/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">پرهزینه‌ترین خدمت</p>
              <p className="font-semibold">{topExpense.name}</p>
              {topLand ? (
                <p className="text-xs text-muted-foreground">{topLand.title}</p>
              ) : null}
              <PriceDisplay amount={topExpense.totalToman} size="sm" />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
