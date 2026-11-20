/** Tabs and filter labels of the billing pages (statuses reuse src/lib/admin/labels.ts). */

export const SUBSCRIPTION_TABS = [
  { key: "all", label: "همه" },
  { key: "active", label: "فعال" },
  { key: "pending", label: "در انتظار پرداخت" },
  { key: "expired", label: "منقضی" },
  { key: "cancelled", label: "لغو شده" },
] as const;

export const PAYMENT_TABS = [
  { key: "all", label: "همه" },
  { key: "paid", label: "موفق" },
  { key: "open", label: "باز / در انتظار" },
  { key: "failed", label: "ناموفق / لغو" },
  { key: "refunds", label: "بازپرداخت‌شده" },
] as const;

export const PAYMENT_PERIOD_LABELS: Record<string, string> = {
  "30d": "۳۰ روز اخیر",
  "365d": "یک سال اخیر",
  "7d": "۷ روز اخیر",
  "90d": "۹۰ روز اخیر",
  all: "همه زمان‌ها",
  today: "امروز",
};

export const GATEWAY_LABELS: Record<string, string> = {
  mock: "درگاه آزمایشی",
};
