"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/mock/constants";
import type { Land } from "@/types";
import type { LandFormValues } from "@/lib/validators/land";

interface ConsumerState {
  lands: Land[];
  setLands: (lands: Land[]) => void;
  addLand: (userId: string, data: LandFormValues) => Land;
  updateLand: (landId: string, data: LandFormValues) => void;
  deleteLand: (landId: string) => void;
}

export const useConsumerStore = create<ConsumerState>()(
  persist(
    (set, get) => ({
      lands: [],

      setLands: (lands) => {
        set({ lands });
      },

      addLand: (userId, data) => {
        const land: Land = {
          id: crypto.randomUUID(),
          userId,
          title: data.title,
          areaSqm: data.areaSqm,
          location: data.location,
          description: data.description,
          createdAt: new Date().toISOString(),
        };

        set({ lands: [...get().lands, land] });
        return land;
      },

      updateLand: (landId, data) => {
        set({
          lands: get().lands.map((land) =>
            land.id === landId
              ? {
                  ...land,
                  title: data.title,
                  areaSqm: data.areaSqm,
                  location: data.location,
                  description: data.description,
                }
              : land,
          ),
        });
      },

      deleteLand: (landId) => {
        set({
          lands: get().lands.filter((land) => land.id !== landId),
        });
      },
    }),
    {
      name: STORAGE_KEYS.consumer,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
