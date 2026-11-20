import type { Tone } from "@/lib/admin/labels";

/** Status of one provider invitation (service_request_providers.status). */
export const LINK_STATUS: Record<string, { label: string; tone: Tone }> = {
  accepted: { label: "پذیرفت", tone: "success" },
  rejected: { label: "رد کرد", tone: "danger" },
  removed: { label: "برداشته شد", tone: "neutral" },
  sent: { label: "منتظر پاسخ", tone: "warning" },
};

export const LINK_REMOVED_REASON: Record<string, string> = {
  accepted_by_other: "خدمات‌دهنده دیگری پذیرفت",
  admin_removed: "برداشته‌شده توسط پشتیبانی",
  expired: "منقضی شد",
  request_cancelled: "درخواست لغو شد",
};

export const ACTOR_TYPE: Record<string, string> = {
  admin: "مدیر",
  consumer: "خدمات‌گیرنده",
  provider: "خدمات‌دهنده",
  system: "سامانه",
};

export const CANCELLED_BY: Record<string, string> = {
  admin: "پشتیبانی",
  consumer: "خدمات‌گیرنده",
  provider: "خدمات‌دهنده",
};

export const PERIOD_OPTIONS = [
  { label: "همه زمان‌ها", value: "all" },
  { label: "امروز", value: "today" },
  { label: "۷ روز اخیر", value: "7d" },
  { label: "۳۰ روز اخیر", value: "30d" },
  { label: "۹۰ روز اخیر", value: "90d" },
] as const;

export const SORT_OPTIONS = [
  { label: "جدیدترین", value: "newest" },
  { label: "قدیمی‌ترین", value: "oldest" },
  { label: "آخرین تغییر", value: "updated" },
  { label: "بیشترین مبلغ", value: "price" },
] as const;

export const STATUS_TABS = [
  { key: "all", label: "همه" },
  { key: "awaiting_send", label: "در انتظار ارسال" },
  { key: "pending_provider", label: "منتظر پاسخ" },
  { key: "in_progress", label: "در حال انجام" },
  { key: "completed", label: "انجام شده" },
  { key: "cancelled", label: "لغو شده" },
] as const;
