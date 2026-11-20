import type { Tone } from "@/lib/admin/labels";

/** notifications.type → what the admin reads. Unknown types fall back to the raw code. */
export const NOTIFICATION_TYPE: Record<string, string> = {
  admin_broadcast: "پیام مدیر",
  payment_failed: "پرداخت ناموفق",
  payment_paid: "پرداخت موفق",
  request_accepted: "پذیرش درخواست",
  request_cancelled: "لغو درخواست",
  request_completed: "انجام درخواست",
  request_new: "درخواست جدید",
  request_rejected: "رد درخواست",
  subscription_expired: "پایان اشتراک",
  subscription_granted: "فعال شدن اشتراک",
};

export const typeLabel = (type: string) => NOTIFICATION_TYPE[type] ?? type;

export const AUDIENCE_OPTIONS = [
  { description: "یک نفر را با نام یا شماره موبایل پیدا کنید.", key: "user", label: "یک کاربر" },
  { description: "همه حساب‌های فعال (حذف‌شده‌ها و غیرفعال‌ها نه).", key: "all", label: "همه کاربران" },
  { description: "کاربرانی که پروفایل خدمات‌دهنده ندارند.", key: "consumers", label: "خدمات‌گیرندگان" },
  { description: "همه کسانی که پروفایل خدمات‌دهنده دارند.", key: "providers", label: "همه خدمات‌دهندگان" },
  {
    description: "خدمات‌دهندگانی که الان در جستجوی کشاورزان دیده می‌شوند.",
    key: "eligible_providers",
    label: "خدمات‌دهندگان قابل جستجو",
  },
  {
    description: "خدمات‌دهندگان فعالی که اشتراک فعال ندارند؛ مثلاً برای یادآوری تمدید.",
    key: "providers_without_subscription",
    label: "خدمات‌دهندگان بدون اشتراک",
  },
  { description: "کاربرانی که این استان را در پروفایل خود ثبت کرده‌اند.", key: "province", label: "کاربران یک استان" },
] as const;

export function audienceLabel(audience: { kind: string; provinceName: string | null; userName: string | null }): string {
  if (audience.kind === "user") return audience.userName ? `کاربر: ${audience.userName}` : "یک کاربر";
  if (audience.kind === "province") return audience.provinceName ? `استان ${audience.provinceName}` : "یک استان";
  return AUDIENCE_OPTIONS.find((option) => option.key === audience.kind)?.label ?? audience.kind;
}

/** Destinations offered in the composer; values must match ADMIN_BROADCAST_LINKS on the server. */
export const DEEP_LINK_OPTIONS: Array<{ group: string; label: string; value: string }> = [
  { group: "خدمات‌گیرنده", label: "خانه", value: "/users/home" },
  { group: "خدمات‌گیرنده", label: "جستجوی خدمات", value: "/users/search" },
  { group: "خدمات‌گیرنده", label: "درخواست‌های من", value: "/users/requests" },
  { group: "خدمات‌گیرنده", label: "زمین‌های من", value: "/users/lands" },
  { group: "خدمات‌گیرنده", label: "گزارش هزینه‌ها", value: "/users/reports" },
  { group: "خدمات‌دهنده", label: "خانه خدمات‌دهنده", value: "/provider/home" },
  { group: "خدمات‌دهنده", label: "درخواست‌های دریافتی", value: "/provider/requests" },
  { group: "خدمات‌دهنده", label: "خدمات و قیمت‌ها", value: "/provider/services" },
  { group: "خدمات‌دهنده", label: "اشتراک", value: "/provider/subscription" },
  { group: "خدمات‌دهنده", label: "گزارش درآمد", value: "/provider/reports" },
  { group: "عمومی", label: "پروفایل", value: "/profile" },
];

export const deepLinkLabel = (value: string | null) =>
  value ? (DEEP_LINK_OPTIONS.find((option) => option.value === value)?.label ?? value) : null;

export const DELIVERY_STATUS: Record<string, { label: string; tone: Tone }> = {
  delivered: { label: "تحویل شد", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  queued: { label: "در صف", tone: "info" },
  sent: { label: "ارسال شد", tone: "success" },
  skipped: { label: "رد شد", tone: "neutral" },
};

export const CHANNEL: Record<string, string> = {
  in_app: "درون‌برنامه",
  push: "پوش",
  sms: "پیامک",
};

export const SKIP_REASON: Record<string, string> = {
  channel_provider_unavailable: "سرویس این کانال پیکربندی نشده است",
};

export const PERIOD_OPTIONS = [
  { label: "همه زمان‌ها", value: "all" },
  { label: "امروز", value: "today" },
  { label: "۷ روز اخیر", value: "7d" },
  { label: "۳۰ روز اخیر", value: "30d" },
  { label: "۹۰ روز اخیر", value: "90d" },
] as const;
