"use client";

import { useMemo, useState } from "react";
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
import {
  getConsumerCompletedCount,
  getConsumerMonthlyChartData,
  getConsumerMonthlyCost,
  getConsumerTotalCost,
  getLandTitle,
  getServiceLabel,
  getTopConsumerExpense,
} from "@/lib/utils/consumer-requests";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useRequestStore } from "@/stores/request-store";

export default function ConsumerReportsPage() {
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const requests = useRequestStore((state) => state.requests);
  const [landFilter, setLandFilter] = useState<string>("all");

  const userLands = useMemo(
    () => (user ? lands.filter((land) => land.userId === user.id) : []),
    [lands, user],
  );

  if (!user) return null;

  const consumerId = user.id;
  const totalCost = getConsumerTotalCost(consumerId, requests);
  const monthlyCost = getConsumerMonthlyCost(consumerId, requests);
  const completedCount = getConsumerCompletedCount(consumerId, requests);
  const chartData = getConsumerMonthlyChartData(
    consumerId,
    requests,
    landFilter === "all" ? undefined : landFilter,
  );
  const topExpense = getTopConsumerExpense(consumerId, requests);

  return (
    <PageContainer withDock>
      <PageHeader
        title="گزارشات مالی"
        description="تحلیل هزینه‌های خدمات دریافتی"
      />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="هزینه سال"
          value={totalCost > 0 ? `${Math.round(totalCost / 1_000_000)}M` : "۰"}
          icon={Wallet}
        />
        <StatCard
          label="هزینه ماه"
          value={monthlyCost > 0 ? `${Math.round(monthlyCost / 1_000_000)}M` : "۰"}
          icon={Receipt}
        />
      </div>

      <Card className="card-elevated mb-4 border-border/70">
        <CardContent className="p-4">
          <p className="mb-1 text-sm font-semibold">خدمات دریافت‌شده</p>
          <p className="text-3xl font-bold text-accent">
            {toPersianDigits(completedCount)}
          </p>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 overflow-hidden border-border/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PieChart className="size-4 text-accent" />
              <p className="text-sm font-semibold">هزینه ۱۲ ماه اخیر</p>
            </div>
            <div className="space-y-1">
              <Label className="sr-only">فیلتر زمین</Label>
              <Select value={landFilter} onValueChange={setLandFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه زمین‌ها</SelectItem>
                  {userLands.map((land) => (
                    <SelectItem key={land.id} value={land.id}>
                      {land.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e4d8" />
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
                  fill="#f4a261"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {topExpense ? (
        <Card className="overflow-hidden border-accent/25 bg-gradient-to-l from-accent/5 to-transparent">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <MapPin className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">پرهزینه‌ترین خدمت</p>
              <p className="font-semibold">
                {getServiceLabel(topExpense.serviceId)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getLandTitle(topExpense.landId, userLands)}
              </p>
              <PriceDisplay amount={topExpense.amount} size="sm" />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
