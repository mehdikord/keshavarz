"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ProviderSeedData } from "@/lib/mock/users";
import { STORAGE_KEYS } from "@/lib/mock/constants";
import type { GeoLocation, OfferedService, UserSubscription } from "@/types";

export interface SubscriptionPurchaseRecord {
  planId: string;
  price: number;
  purchasedAt: string;
}

interface ProviderState {
  workCenter: GeoLocation | null;
  workRadiusKm: number;
  offeredServices: OfferedService[];
  subscription: UserSubscription | null;
  purchaseHistory: SubscriptionPurchaseRecord[];
  loadFromSeed: (data: ProviderSeedData) => void;
  reset: () => void;
  setWorkArea: (workCenter: GeoLocation, workRadiusKm: number) => void;
  addService: (service: OfferedService) => void;
  updateServicePrice: (serviceId: string, price: number) => void;
  removeService: (serviceId: string) => void;
  purchaseSubscription: (planId: string, durationMonths: number, price: number) => void;
}

const defaultState = {
  workCenter: null as GeoLocation | null,
  workRadiusKm: 50,
  offeredServices: [] as OfferedService[],
  subscription: null as UserSubscription | null,
  purchaseHistory: [] as SubscriptionPurchaseRecord[],
};

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      loadFromSeed: (data) => {
        set({
          workCenter: data.workCenter,
          workRadiusKm: data.workRadiusKm,
          offeredServices: data.offeredServices,
          subscription: data.subscription,
          purchaseHistory: get().purchaseHistory,
        });
      },

      reset: () => {
        set(defaultState);
      },

      setWorkArea: (workCenter, workRadiusKm) => {
        set({ workCenter, workRadiusKm });
      },

      addService: (service) => {
        const { offeredServices } = get();
        if (offeredServices.some((item) => item.serviceId === service.serviceId)) {
          return;
        }
        set({ offeredServices: [...offeredServices, service] });
      },

      updateServicePrice: (serviceId, price) => {
        set({
          offeredServices: get().offeredServices.map((service) =>
            service.serviceId === serviceId ? { ...service, price } : service,
          ),
        });
      },

      removeService: (serviceId) => {
        set({
          offeredServices: get().offeredServices.filter(
            (service) => service.serviceId !== serviceId,
          ),
        });
      },

      purchaseSubscription: (planId, durationMonths, price) => {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        set({
          subscription: {
            planId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            isActive: true,
          },
          purchaseHistory: [
            {
              planId,
              price,
              purchasedAt: startDate.toISOString(),
            },
            ...get().purchaseHistory,
          ],
        });
      },
    }),
    {
      name: STORAGE_KEYS.provider,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export { hasActiveSubscription } from "@/lib/utils/subscription";
