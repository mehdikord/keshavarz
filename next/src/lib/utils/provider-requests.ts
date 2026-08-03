import { SEED_USERS } from "@/lib/mock/users";
import { getServiceById } from "@/lib/mock/catalog";
import type { Request, RequestProvider } from "@/types";

export type ProviderRequestTab =
  | "new"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ProviderRequestView {
  request: Request;
  providerLink: RequestProvider;
}

export function getProviderRequestsForTab(
  providerId: string,
  tab: ProviderRequestTab,
  requests: Request[],
  requestProviders: RequestProvider[],
): ProviderRequestView[] {
  const views = requests
    .map((request) => {
      const providerLink = requestProviders.find(
        (item) =>
          item.requestId === request.id && item.providerId === providerId,
      );

      if (!providerLink) return null;

      return { request, providerLink };
    })
    .filter((item): item is ProviderRequestView => item !== null);

  switch (tab) {
    case "new":
      return views.filter(
        ({ request, providerLink }) =>
          request.status === "pending_provider" &&
          providerLink.status === "sent",
      );
    case "in_progress":
      return views.filter(
        ({ request }) =>
          request.status === "in_progress" &&
          request.assignedProviderId === providerId,
      );
    case "completed":
      return views.filter(
        ({ request }) =>
          request.status === "completed" &&
          request.assignedProviderId === providerId,
      );
    case "cancelled":
      return views.filter(({ request }) => request.status === "cancelled");
    default:
      return [];
  }
}

export function countNewProviderRequests(
  providerId: string,
  requests: Request[],
  requestProviders: RequestProvider[],
): number {
  return getProviderRequestsForTab(
    providerId,
    "new",
    requests,
    requestProviders,
  ).length;
}

export function getUserDisplayName(userId: string): string {
  return (
    SEED_USERS.find((user) => user.id === userId)?.displayName ?? "کاربر"
  );
}

export function getUserPhone(userId: string): string | undefined {
  return SEED_USERS.find((user) => user.id === userId)?.phone;
}

export function getServiceLabel(serviceId: string): string {
  return getServiceById(serviceId)?.name ?? "خدمت نامشخص";
}

export function getProviderMonthlyIncome(
  providerId: string,
  requests: Request[],
  referenceDate = new Date(),
): number {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  return requests
    .filter(
      (request) =>
        request.status === "completed" &&
        request.assignedProviderId === providerId &&
        request.completedAt &&
        new Date(request.completedAt).getMonth() === month &&
        new Date(request.completedAt).getFullYear() === year,
    )
    .reduce((sum, request) => sum + request.price, 0);
}

export function getProviderTotalIncome(
  providerId: string,
  requests: Request[],
): number {
  return requests
    .filter(
      (request) =>
        request.status === "completed" &&
        request.assignedProviderId === providerId,
    )
    .reduce((sum, request) => sum + request.price, 0);
}

export function getProviderCompletedCount(
  providerId: string,
  requests: Request[],
): number {
  return requests.filter(
    (request) =>
      request.status === "completed" &&
      request.assignedProviderId === providerId,
  ).length;
}

export function getProviderMonthlyChartData(
  providerId: string,
  requests: Request[],
): { month: string; amount: number }[] {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const amount = requests
      .filter(
        (request) =>
          request.status === "completed" &&
          request.assignedProviderId === providerId &&
          request.completedAt &&
          new Date(request.completedAt).getMonth() === month &&
          new Date(request.completedAt).getFullYear() === year,
      )
      .reduce((sum, request) => sum + request.price, 0);

    const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      month: "short",
    }).format(date);

    return { month: monthLabel, amount };
  });
}

export function getTopProviderService(
  providerId: string,
  requests: Request[],
): { serviceId: string; amount: number } | null {
  const totals = new Map<string, number>();

  for (const request of requests) {
    if (
      request.status !== "completed" ||
      request.assignedProviderId !== providerId
    ) {
      continue;
    }

    totals.set(
      request.serviceId,
      (totals.get(request.serviceId) ?? 0) + request.price,
    );
  }

  let top: { serviceId: string; amount: number } | null = null;

  for (const [serviceId, amount] of totals) {
    if (!top || amount > top.amount) {
      top = { serviceId, amount };
    }
  }

  return top;
}
