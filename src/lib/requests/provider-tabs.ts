export type ProviderRequestTab = "new" | "active" | "done" | "archive";

export type ProviderRequestTone = "new" | "active" | "done" | "muted" | "danger";

export interface ProviderRequestState {
  tab: ProviderRequestTab;
  label: string;
  tone: ProviderRequestTone;
}

/**
 * Maps a request's (request status, provider link status) pair to the provider's
 * point of view. When another provider accepts first, the server marks this
 * provider's link as `removed` while the request moves on.
 */
export function classifyProviderRequest(item: {
  status: string;
  linkStatus: string;
}): ProviderRequestState {
  const { status, linkStatus } = item;

  if (linkStatus === "sent" && status === "pending_provider") {
    return { tab: "new", label: "منتظر پاسخ شما", tone: "new" };
  }
  if (linkStatus === "accepted" && status === "in_progress") {
    return { tab: "active", label: "در حال انجام", tone: "active" };
  }
  if (linkStatus === "accepted" && status === "completed") {
    return { tab: "done", label: "انجام شد", tone: "done" };
  }
  if (status === "cancelled") {
    return { tab: "archive", label: "لغو شد", tone: "danger" };
  }
  if (linkStatus === "rejected") {
    return { tab: "archive", label: "رد کردید", tone: "muted" };
  }
  if (linkStatus === "removed" && (status === "in_progress" || status === "completed")) {
    return { tab: "archive", label: "به خدمات‌دهنده دیگری سپرده شد", tone: "muted" };
  }
  if (linkStatus === "removed") {
    return { tab: "archive", label: "کشاورز درخواست را پس گرفت", tone: "muted" };
  }
  return { tab: "archive", label: "بسته شد", tone: "muted" };
}

export function parseProviderRequestTab(value: string | null): ProviderRequestTab {
  return value === "active" || value === "done" || value === "archive" ? value : "new";
}
