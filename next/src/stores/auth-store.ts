"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  DEFAULT_DISPLAY_NAME,
  MOCK_OTP,
  STORAGE_KEYS,
} from "@/lib/mock/constants";
import { syncUserDataFromSeed } from "@/lib/mock/sync-user-data";
import { findUserByPhone } from "@/lib/mock/users";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => boolean;
  logout: () => void;
  updateDisplayName: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (phone, otp) => {
        if (otp !== MOCK_OTP) {
          return false;
        }

        const now = new Date().toISOString();
        const existing = findUserByPhone(phone);
        const user: User = existing ?? {
          id: crypto.randomUUID(),
          phone,
          displayName: DEFAULT_DISPLAY_NAME,
          createdAt: now,
          updatedAt: now,
        };

        set({ user, isAuthenticated: true });
        syncUserDataFromSeed(user.id);
        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateDisplayName: (name) => {
        const { user } = get();
        if (!user) return;

        set({
          user: {
            ...user,
            displayName: name.trim(),
            updatedAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
