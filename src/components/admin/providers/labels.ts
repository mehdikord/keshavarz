import type { Tone } from "@/lib/admin/labels";

/** Why a provider is out of farmers' search, in the order the app checks them. */
export const ELIGIBILITY_GAP: Record<string, { hint: string; label: string }> = {
  active: { hint: "پروفایل خدمات‌دهندگی غیرفعال شده است.", label: "پروفایل فعال" },
  availability: { hint: "خدمات‌دهنده اعلام کرده فعلاً کار نمی‌پذیرد.", label: "آماده پذیرش کار" },
  services: { hint: "هیچ خدمت فعالی با قیمت ثبت نشده است.", label: "دست‌کم یک خدمت فعال" },
  subscription: { hint: "اشتراک فعالی که امروز را پوشش دهد ندارد.", label: "اشتراک فعال" },
  workArea: { hint: "مرکز فعالیت روی نقشه مشخص نشده است.", label: "محدوده و موقعیت کاری" },
};

export const ELIGIBILITY_ORDER = ["active", "availability", "workArea", "subscription", "services"] as const;

export const PROVIDER_TAB_LABELS = [
  { key: "active", label: "فعال" },
  { key: "eligible", label: "قابل نمایش در جستجو" },
  { key: "unavailable", label: "عدم پذیرش کار" },
  { key: "no_subscription", label: "بدون اشتراک" },
  { key: "inactive", label: "غیرفعال" },
  { key: "any", label: "همه" },
] as const;

export const LINK_STATUS: Record<string, { label: string; tone: Tone }> = {
  accepted: { label: "پذیرفته", tone: "success" },
  rejected: { label: "رد کرده", tone: "danger" },
  removed: { label: "خارج از صف", tone: "neutral" },
  sent: { label: "در انتظار پاسخ", tone: "warning" },
};

export const PRICE_CHANGED_BY: Record<string, string> = {
  admin: "مدیر",
  provider: "خدمات‌دهنده",
  system: "سامانه",
};
