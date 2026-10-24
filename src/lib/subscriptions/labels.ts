export type StatusTone = "good" | "warn" | "bad" | "muted";

export function subscriptionStatusInfo(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "active":
      return { label: "فعال", tone: "good" };
    case "pending_payment":
      return { label: "در انتظار پرداخت", tone: "warn" };
    case "cancelled":
      return { label: "لغو شده", tone: "bad" };
    case "expired":
      return { label: "منقضی", tone: "muted" };
    default:
      return { label: "غیرفعال", tone: "muted" };
  }
}

export function paymentStatusInfo(status: string): { label: string; tone: StatusTone } {
  switch (status) {
    case "paid":
      return { label: "پرداخت‌شده", tone: "good" };
    case "pending":
    case "initiated":
      return { label: "در انتظار تأیید", tone: "warn" };
    case "failed":
      return { label: "ناموفق", tone: "bad" };
    case "refunded":
      return { label: "بازگشت داده شد", tone: "muted" };
    default:
      return { label: status, tone: "muted" };
  }
}

export function isPaymentPending(status: string): boolean {
  return status === "pending" || status === "initiated";
}

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  good: "bg-[#d8f3dc] text-[#1b5e3b]",
  warn: "bg-[#fdefd6] text-[#9a5b13]",
  bad: "bg-[#fde2dc] text-[#b23a1f]",
  muted: "bg-muted text-muted-foreground",
};

export function addMonths(from: Date, months: number): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}
