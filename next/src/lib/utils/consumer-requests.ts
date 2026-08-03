import { getServiceById } from "@/lib/mock/catalog";
import { SEED_USERS } from "@/lib/mock/users";
import type { Land, Request, RequestProvider } from "@/types";

export type ConsumerRequestTab =
  | "pending_provider"
  | "in_progress"
  | "completed"
  | "cancelled";

export function getConsumerRequestsForTab(
  consumerId: string,
  tab: ConsumerRequestTab,
  requests: Request[],
): Request[] {
  return requests.filter(
    (request) =>
      request.consumerId === consumerId && request.status === tab,
  );
}

export function getProviderDisplayName(providerId: string): string {
  return (
    SEED_USERS.find((user) => user.id === providerId)?.displayName ?? "خدمات‌دهنده"
  );
}

export function getProviderPhone(providerId: string): string | undefined {
  return SEED_USERS.find((user) => user.id === providerId)?.phone;
}

export function getServiceLabel(serviceId: string): string {
  return getServiceById(serviceId)?.name ?? "خدمت نامشخص";
}

export function getLandTitle(landId: string, lands: Land[]): string {
  return lands.find((land) => land.id === landId)?.title ?? "زمین نامشخص";
}

export function countPendingProvidersForRequest(
  requestId: string,
  requestProviders: RequestProvider[],
): number {
  return requestProviders.filter(
    (item) => item.requestId === requestId && item.status === "sent",
  ).length;
}

export function getConsumerMonthlyCost(
  consumerId: string,
  requests: Request[],
  referenceDate = new Date(),
): number {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  return requests
    .filter(
      (request) =>
        request.consumerId === consumerId &&
        request.status === "completed" &&
        request.completedAt &&
        new Date(request.completedAt).getMonth() === month &&
        new Date(request.completedAt).getFullYear() === year,
    )
    .reduce((sum, request) => sum + request.price, 0);
}

export function getConsumerTotalCost(
  consumerId: string,
  requests: Request[],
  year = new Date().getFullYear(),
): number {
  return requests
    .filter(
      (request) =>
        request.consumerId === consumerId &&
        request.status === "completed" &&
        request.completedAt &&
        new Date(request.completedAt).getFullYear() === year,
    )
    .reduce((sum, request) => sum + request.price, 0);
}

export function getConsumerCompletedCount(
  consumerId: string,
  requests: Request[],
): number {
  return requests.filter(
    (request) =>
      request.consumerId === consumerId && request.status === "completed",
  ).length;
}

export function getConsumerMonthlyChartData(
  consumerId: string,
  requests: Request[],
  landId?: string,
): { month: string; amount: number }[] {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    const month = date.getMonth();
    const year = date.getFullYear();

    const amount = requests
      .filter(
        (request) =>
          request.consumerId === consumerId &&
          request.status === "completed" &&
          request.completedAt &&
          new Date(request.completedAt).getMonth() === month &&
          new Date(request.completedAt).getFullYear() === year &&
          (!landId || request.landId === landId),
      )
      .reduce((sum, request) => sum + request.price, 0);

    const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      month: "short",
    }).format(date);

    return { month: monthLabel, amount };
  });
}

export function getTopConsumerExpense(
  consumerId: string,
  requests: Request[],
): { serviceId: string; landId: string; amount: number } | null {
  let top: { serviceId: string; landId: string; amount: number } | null = null;

  for (const request of requests) {
    if (
      request.consumerId !== consumerId ||
      request.status !== "completed"
    ) {
      continue;
    }

    if (!top || request.price > top.amount) {
      top = {
        serviceId: request.serviceId,
        landId: request.landId,
        amount: request.price,
      };
    }
  }

  return top;
}

export function findMatchingPendingRequest(
  consumerId: string,
  landId: string,
  serviceId: string,
  scheduledDates: string[],
  requests: Request[],
): Request | undefined {
  const sortedDates = [...scheduledDates].sort().join("|");

  return requests.find((request) => {
    if (request.consumerId !== consumerId) return false;
    if (request.landId !== landId) return false;
    if (request.serviceId !== serviceId) return false;
    if (request.status !== "pending_provider") return false;
    return [...request.scheduledDates].sort().join("|") === sortedDates;
  });
}
