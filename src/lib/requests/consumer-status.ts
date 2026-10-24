export type ConsumerRequestTone = "waiting" | "active" | "done" | "cancelled";

export interface ConsumerRequestState {
  label: string;
  tone: ConsumerRequestTone;
  /** Completed steps out of: submitted → accepted → done. */
  step: 1 | 2 | 3;
}

export function consumerRequestState(status: string): ConsumerRequestState {
  switch (status) {
    case "in_progress":
      return { label: "در حال انجام", tone: "active", step: 2 };
    case "completed":
      return { label: "انجام شد", tone: "done", step: 3 };
    case "cancelled":
      return { label: "لغو شد", tone: "cancelled", step: 1 };
    default:
      return { label: "در انتظار پاسخ خدمات‌دهنده", tone: "waiting", step: 1 };
  }
}

export const CONSUMER_TONE_PILL: Record<ConsumerRequestTone, string> = {
  waiting: "bg-[#fdebd3] text-[#9a4f12]",
  active: "bg-[#e1f0dc] text-[#2f6a35]",
  done: "bg-[#d8f3dc] text-[#1b5e3b]",
  cancelled: "bg-[#fde2dc] text-[#b23a1f]",
};
