import {
  formatJalaliInput,
  type ReportPeriod,
} from "@/server/modules/admin/reports/report-period";
import type { ReportDataset } from "@/server/modules/admin/reports/reports-admin.schemas";
import {
  getGrowthReport,
  getMarketplaceReport,
  getProvidersReport,
  getRevenueReport,
  type Compared,
  type ComparedNullable,
  type SeriesPoint,
} from "@/server/modules/admin/reports/reports-admin.service";

type Cell = string | number | null | undefined;

/** RFC 4180 with a UTF-8 BOM so Excel opens Persian text correctly. */
export function toCsv(header: string[], rows: Cell[][]): string {
  const escape = (cell: Cell) => {
    if (cell === null || cell === undefined) return "";
    const text = typeof cell === "number" ? (Number.isInteger(cell) ? String(cell) : cell.toFixed(2)) : cell;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return `﻿${[header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n")}\r\n`;
}

const jalali = (day: string) => formatJalaliInput(day).replace(/-/g, "/");

function seriesRows(series: SeriesPoint[], columns: Array<[string, string]>) {
  return {
    header: ["از تاریخ", "تا تاریخ", ...columns.map(([, label]) => label)],
    rows: series.map((point) => [jalali(point.key), jalali(point.last), ...columns.map(([key]) => point.values[key] ?? 0)]),
  };
}

function summaryRows(kpis: Record<string, Compared | ComparedNullable>, labels: Record<string, string>) {
  return {
    header: ["شاخص", "بازه انتخابی", "بازه قبل"],
    rows: Object.entries(labels).map(([key, label]) => [label, kpis[key]?.current ?? null, kpis[key]?.previous ?? null]),
  };
}

const GROWTH_LABELS = {
  newUsers: "کاربر جدید",
  newProviders: "خدمات‌دهنده جدید",
  activeUsers: "کاربر فعال",
  totalUsers: "کل کاربران در پایان بازه",
  providerShare: "سهم خدمات‌دهندگان از کاربران (درصد)",
};

const MARKETPLACE_LABELS = {
  created: "درخواست ثبت‌شده",
  completed: "کار انجام‌شده (بر اساس تاریخ انجام)",
  gmv: "ارزش کارهای انجام‌شده (تومان)",
  averageOrder: "میانگین مبلغ هر کار (تومان)",
  completionRate: "نرخ انجام (درصد)",
  cancellationRate: "نرخ لغو (درصد)",
  medianToAccept: "میانه زمان تا پذیرش (ثانیه)",
  medianToComplete: "میانه زمان تا انجام (ثانیه)",
  unmatched: "درخواست بدون خدمات‌دهنده",
};

const REVENUE_LABELS = {
  gross: "درآمد ناخالص (تومان)",
  refunds: "بازپرداخت (تومان)",
  net: "درآمد خالص (تومان)",
  payments: "تعداد پرداخت موفق",
  averagePayment: "میانگین پرداخت (تومان)",
  failedPayments: "پرداخت ناموفق",
  activeSubscriptions: "اشتراک فعال در پایان بازه",
  adminGrants: "اشتراک اعطایی مدیر",
};

const PROVIDER_LABELS = {
  invitationsSent: "دعوت ارسال‌شده",
  acceptanceRate: "نرخ پذیرش (درصد)",
  medianResponse: "میانه زمان پاسخ (ثانیه)",
  invitedProviders: "خدمات‌دهنده دعوت‌شده",
  workingProviders: "خدمات‌دهنده دارای کار انجام‌شده",
  jobsPerProvider: "میانگین کار به ازای هر خدمات‌دهنده فعال",
};

export async function buildReportCsv(
  dataset: ReportDataset,
  period: ReportPeriod,
  now: Date,
): Promise<{ csv: string; filename: string; rows: number }> {
  let table: { header: string[]; rows: Cell[][] };

  switch (dataset) {
    case "growth-summary":
      table = summaryRows((await getGrowthReport(period)).kpis, GROWTH_LABELS);
      break;
    case "growth-series":
      table = seriesRows((await getGrowthReport(period)).series, [
        ["newUsers", "کاربر جدید"],
        ["newProviders", "خدمات‌دهنده جدید"],
        ["totalUsers", "کل کاربران"],
        ["totalProviders", "کل خدمات‌دهندگان"],
      ]);
      break;
    case "growth-provinces":
      table = {
        header: ["استان", "کاربر جدید", "از این تعداد خدمات‌دهنده"],
        rows: (await getGrowthReport(period)).provinces.map((row) => [row.name ?? "نامشخص", row.total, row.providers]),
      };
      break;
    case "marketplace-summary":
      table = summaryRows((await getMarketplaceReport(period)).kpis, MARKETPLACE_LABELS);
      break;
    case "marketplace-series":
      table = seriesRows((await getMarketplaceReport(period)).series, [
        ["created", "درخواست ثبت‌شده"],
        ["completed", "کار انجام‌شده"],
        ["gmv", "ارزش کارهای انجام‌شده (تومان)"],
      ]);
      break;
    case "marketplace-services":
      table = {
        header: ["خدمت", "دسته", "درخواست", "انجام‌شده", "لغوشده", "بدون خدمات‌دهنده", "ارزش انجام‌شده (تومان)", "خدمات‌دهنده فعال"],
        rows: (await getMarketplaceReport(period)).services.map((row) => [
          row.name,
          row.categoryName,
          row.created,
          row.completed,
          row.cancelled,
          row.unmatched,
          row.gmv,
          row.supply,
        ]),
      };
      break;
    case "marketplace-categories":
      table = {
        header: ["دسته", "تعداد خدمت", "درخواست", "انجام‌شده", "لغوشده", "ارزش انجام‌شده (تومان)"],
        rows: (await getMarketplaceReport(period)).categories.map((row) => [
          row.name,
          row.services,
          row.created,
          row.completed,
          row.cancelled,
          row.gmv,
        ]),
      };
      break;
    case "marketplace-provinces":
      table = {
        header: ["استان خدمات‌گیرنده", "درخواست", "انجام‌شده"],
        rows: (await getMarketplaceReport(period)).provinces.map((row) => [row.name ?? "نامشخص", row.created, row.completed]),
      };
      break;
    case "revenue-summary":
      table = summaryRows((await getRevenueReport(period, now)).kpis, REVENUE_LABELS);
      break;
    case "revenue-series":
      table = seriesRows((await getRevenueReport(period, now)).series, [
        ["paid", "پرداخت موفق (تومان)"],
        ["refunded", "بازپرداخت (تومان)"],
        ["net", "خالص (تومان)"],
        ["activeSubscriptions", "اشتراک فعال در پایان"],
      ]);
      break;
    case "revenue-plans":
      table = {
        header: ["پلن", "تعداد پرداخت", "مبلغ کل (تومان)", "خرید اول (تومان)", "تمدید (تومان)"],
        rows: (await getRevenueReport(period, now)).plans.map((row) => [
          row.name,
          row.payments,
          row.amount,
          row.firstAmount,
          row.renewalAmount,
        ]),
      };
      break;
    case "providers-summary":
      table = summaryRows((await getProvidersReport(period)).kpis, PROVIDER_LABELS);
      break;
    case "providers-leaderboard":
      table = {
        header: ["خدمات‌دهنده", "موبایل", "استان", "کار انجام‌شده", "ارزش کارها (تومان)", "دعوت", "پذیرفته", "ردشده", "نرخ پذیرش (درصد)", "میانگین زمان پاسخ (ثانیه)"],
        rows: (await getProvidersReport(period, 500)).leaderboard.map((row) => [
          row.name,
          row.phone,
          row.province ?? "",
          row.jobs,
          row.gmv,
          row.sent,
          row.accepted,
          row.rejected,
          row.acceptanceRate,
          row.responseSeconds === null ? null : Math.round(row.responseSeconds),
        ]),
      };
      break;
  }

  const filename = `keshavarz-${dataset}-${formatJalaliInput(period.from)}_${formatJalaliInput(period.to)}.csv`;
  return { csv: toCsv(table.header, table.rows), filename, rows: table.rows.length };
}
