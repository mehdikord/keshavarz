import { toast } from "sonner";

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(iso));
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeZone: "Asia/Tehran",
  }).format(new Date(iso));
}

/** Admin operators need the full number; keep LTR rendering. */
export function formatAdminPhone(phone: string): string {
  return phone;
}

export async function copyPublicId(value: string, label = "شناسه"): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} کپی شد`);
  } catch {
    toast.error("کپی شناسه ناموفق بود");
  }
}
