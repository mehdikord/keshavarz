/** Persian labels and tones for every status the admin console displays. */

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "wheat";

export const USER_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "فعال", tone: "success" },
  banned: { label: "مسدود", tone: "danger" },
  deleted: { label: "حذف‌شده", tone: "neutral" },
  inactive: { label: "غیرفعال", tone: "neutral" },
  suspended: { label: "تعلیق", tone: "warning" },
};

export const REQUEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  awaiting_send: { label: "در انتظار ارسال", tone: "neutral" },
  cancelled: { label: "لغو شده", tone: "danger" },
  completed: { label: "انجام شده", tone: "success" },
  in_progress: { label: "در حال انجام", tone: "info" },
  pending_provider: { label: "منتظر پاسخ خدمات‌دهنده", tone: "warning" },
};

export const REQUEST_STATUS_ORDER = [
  "awaiting_send",
  "pending_provider",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  cancelled: { label: "لغو شده", tone: "neutral" },
  failed: { label: "ناموفق", tone: "danger" },
  initiated: { label: "شروع شده", tone: "neutral" },
  paid: { label: "پرداخت شده", tone: "success" },
  partially_refunded: { label: "بازپرداخت جزئی", tone: "warning" },
  pending: { label: "در انتظار", tone: "warning" },
  refunded: { label: "بازپرداخت شده", tone: "info" },
};

export const REFUND_STATUS: Record<string, { label: string; tone: Tone }> = {
  cancelled: { label: "لغو شده", tone: "neutral" },
  failed: { label: "ناموفق", tone: "danger" },
  processing: { label: "در حال پردازش", tone: "warning" },
  requested: { label: "درخواست شده", tone: "neutral" },
  succeeded: { label: "انجام شده", tone: "success" },
};

export const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "فعال", tone: "success" },
  cancelled: { label: "لغو شده", tone: "danger" },
  expired: { label: "منقضی", tone: "neutral" },
  pending: { label: "در انتظار", tone: "warning" },
};

export const SUBSCRIPTION_SOURCE: Record<string, string> = {
  admin_grant: "اعطای مدیر",
  promotion: "طرح تشویقی",
  purchase: "خرید",
};

export const PRICING_UNIT: Record<string, string> = {
  fixed: "قیمت ثابت",
  per_day: "هر روز",
  per_hectare: "هر هکتار",
  per_hour: "هر ساعت",
  per_square_meter: "هر متر مربع",
};

export const INBOX_STATUS: Record<string, string> = {
  accepted: "پذیرفته",
  rejected: "ردشده",
  removed: "حذف از صف",
  sent: "دریافت‌شده",
};

export const MODERATION_ACTION: Record<string, { label: string; tone: Tone }> = {
  activate: { label: "فعال‌سازی", tone: "success" },
  ban: { label: "مسدودسازی", tone: "danger" },
  deactivate: { label: "غیرفعال‌سازی", tone: "neutral" },
  suspend: { label: "تعلیق موقت", tone: "warning" },
  unban: { label: "رفع محدودیت", tone: "info" },
  warning: { label: "اخطار", tone: "wheat" },
};

export const SESSION_PLATFORM: Record<string, string> = {
  android: "اندروید",
  ios: "iOS",
  pwa: "اپلیکیشن نصب‌شده",
  unknown: "نامشخص",
  web: "مرورگر وب",
};

export const OTP_PURPOSE: Record<string, string> = {
  login: "ورود",
  phone_change: "تغییر شماره",
  phone_verification: "تأیید شماره",
};

export const DELIVERY_CHANNEL: Record<string, string> = {
  in_app: "درون‌برنامه",
  push: "پوش",
  sms: "پیامک",
};
