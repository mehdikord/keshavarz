import { Badge, type badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const STATUS_TONES: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "فعال", variant: "success" },
  inactive: { label: "غیرفعال", variant: "secondary" },
  pending: { label: "در انتظار", variant: "accent" },
  awaiting_send: { label: "آماده ارسال", variant: "outline" },
  pending_provider: { label: "در انتظار تأیید", variant: "accent" },
  approved: { label: "تأییدشده", variant: "success" },
  rejected: { label: "ردشده", variant: "destructive" },
  suspended: { label: "معلق", variant: "outline" },
  banned: { label: "مسدود", variant: "destructive" },
  completed: { label: "پایان‌یافته", variant: "success" },
  cancelled: { label: "لغوشده", variant: "secondary" },
  expired: { label: "منقضی", variant: "secondary" },
  in_progress: { label: "در حال انجام", variant: "default" },
  "in-progress": { label: "در حال انجام", variant: "default" },
  sent: { label: "ارسال‌شده", variant: "accent" },
  accepted: { label: "پذیرفته‌شده", variant: "success" },
  removed: { label: "حذف‌شده", variant: "secondary" },
  initiated: { label: "آغازشده", variant: "outline" },
  paid: { label: "پرداخت‌شده", variant: "success" },
  partially_refunded: { label: "بازپرداخت جزئی", variant: "outline" },
  refunded: { label: "بازپرداخت‌شده", variant: "outline" },
  requested: { label: "درخواست‌شده", variant: "accent" },
  processing: { label: "در حال پردازش", variant: "default" },
  succeeded: { label: "موفق", variant: "success" },
  failed: { label: "ناموفق", variant: "destructive" },
  // Notification deliveries & export jobs
  queued: { label: "در صف", variant: "outline" },
  delivered: { label: "تحویل‌شده", variant: "success" },
  skipped: { label: "ردشده (نادیده)", variant: "secondary" },
  ready: { label: "آماده", variant: "success" },
  // Recipients & actors
  user: { label: "کاربر", variant: "outline" },
  admin: { label: "مدیر", variant: "outline" },
  consumer: { label: "خدمات‌گیرنده", variant: "outline" },
  provider: { label: "خدمات‌دهنده", variant: "outline" },
  system: { label: "سیستم", variant: "secondary" },
  // Moderation
  suspend: { label: "تعلیق", variant: "outline" },
  ban: { label: "مسدودسازی", variant: "destructive" },
  unban: { label: "رفع مسدودی", variant: "success" },
  activate: { label: "فعال‌سازی", variant: "success" },
  deactivate: { label: "غیرفعال‌سازی", variant: "secondary" },
  warn: { label: "اخطار", variant: "accent" },
  warning: { label: "اخطار", variant: "accent" },
  // Subscription sources
  admin_grant: { label: "اعطای مدیر", variant: "accent" },
  purchase: { label: "خرید", variant: "outline" },
  promotion: { label: "پیشنهاد ویژه", variant: "accent" },
  // Provider-link removal reasons
  admin_removed: { label: "حذف توسط مدیر", variant: "secondary" },
  accepted_by_other: { label: "پذیرش توسط دیگری", variant: "secondary" },
  request_cancelled: { label: "لغو درخواست", variant: "secondary" },
};

/** Persian label for a backend status/enum code (falls back to the code). */
export function adminStatusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_TONES[status]?.label ?? status;
}

interface AdminStatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function AdminStatusBadge({
  status,
  label,
  className,
}: AdminStatusBadgeProps) {
  const tone = STATUS_TONES[status] ?? {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge
      variant={tone.variant}
      className={cn("rounded-md font-medium", className)}
    >
      {label ?? tone.label}
    </Badge>
  );
}
