import { haversineKm } from "@/lib/geo/haversine";
import {
  SEED_PROVIDER_DATA,
  SEED_USERS,
} from "@/lib/mock/users";
import { hasActiveSubscription } from "@/lib/utils/subscription";
import type { Land } from "@/types";

export interface SearchParams {
  land: Land;
  serviceId: string;
  consumerId: string;
}

export interface SearchResult {
  providerId: string;
  displayName: string;
  distanceKm: number;
  price: number;
}

export type SearchSortOption =
  | "price-asc"
  | "price-desc"
  | "distance-asc"
  | "distance-desc";

export function searchProviders(params: SearchParams): SearchResult[] {
  const { land, serviceId, consumerId } = params;

  const results: SearchResult[] = [];

  for (const [providerId, data] of Object.entries(SEED_PROVIDER_DATA)) {
    if (providerId === consumerId) continue;
    if (!hasActiveSubscription(data.subscription)) continue;
    if (!data.workCenter) continue;

    const offered = data.offeredServices.find(
      (service) => service.serviceId === serviceId,
    );
    if (!offered) continue;

    const distanceKm = haversineKm(data.workCenter, land.location);
    if (distanceKm > data.workRadiusKm) continue;

    const user = SEED_USERS.find((item) => item.id === providerId);
    if (!user) continue;

    results.push({
      providerId,
      displayName: user.displayName,
      distanceKm,
      price: offered.price,
    });
  }

  return results;
}

export function sortSearchResults(
  results: SearchResult[],
  sort: SearchSortOption,
): SearchResult[] {
  const sorted = [...results];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "distance-asc":
      return sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    case "distance-desc":
      return sorted.sort((a, b) => b.distanceKm - a.distanceKm);
    default:
      return sorted;
  }
}

export function datesMatch(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}
