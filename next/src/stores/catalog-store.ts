"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { SERVICE_CATEGORIES } from "@/lib/mock/catalog";
import { STORAGE_KEYS } from "@/lib/mock/constants";
import type { Service, ServiceCategory } from "@/types";

interface CatalogState {
  categories: ServiceCategory[];
  setCategories: (categories: ServiceCategory[]) => void;
  getServiceById: (serviceId: string) => Service | undefined;
  getCategoryById: (categoryId: string) => ServiceCategory | undefined;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: SERVICE_CATEGORIES,

      setCategories: (categories) => {
        set({ categories });
      },

      getServiceById: (serviceId) => {
        return get()
          .categories.flatMap((category) => category.services)
          .find((service) => service.id === serviceId);
      },

      getCategoryById: (categoryId) => {
        return get().categories.find((category) => category.id === categoryId);
      },
    }),
    {
      name: STORAGE_KEYS.catalog,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
