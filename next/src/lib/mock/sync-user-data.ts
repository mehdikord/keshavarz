import { STORAGE_KEYS } from "@/lib/mock/constants";
import { SERVICE_CATEGORIES } from "@/lib/mock/catalog";
import { SEED_USER_IDS } from "@/lib/mock/users";
import { useCatalogStore } from "@/stores/catalog-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useProviderStore } from "@/stores/provider-store";
import { useRequestStore } from "@/stores/request-store";
import {
  getLandsForUser,
  getProviderSeedForUser,
} from "@/lib/mock/users";

function hasBeenInitialized(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEYS.initialized) === "true";
}

function markInitialized(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.initialized, "true");
}

export function initializeMockData(): void {
  if (typeof window === "undefined" || hasBeenInitialized()) {
    return;
  }

  useCatalogStore.getState().setCategories(SERVICE_CATEGORIES);
  useRequestStore.getState().seedDemoRequest();
  useNotificationStore.getState().clearAll();

  markInitialized();
}

export function syncUserDataFromSeed(userId: string): void {
  const providerSeed = getProviderSeedForUser(userId);

  if (providerSeed) {
    useProviderStore.getState().loadFromSeed(providerSeed);
  } else {
    useProviderStore.getState().reset();
  }

  useConsumerStore.getState().setLands(getLandsForUser(userId));
}

export function isDemoUser(userId: string): boolean {
  return Object.values(SEED_USER_IDS).includes(
    userId as (typeof SEED_USER_IDS)[keyof typeof SEED_USER_IDS],
  );
}
