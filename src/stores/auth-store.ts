"use client";

import { create } from "zustand";

import {
  fetchAppMe,
  logoutAllAppSessions,
  logoutAppSession,
  mapAppMeToUser,
  patchAppMe,
  type AppMe,
} from "@/lib/api/app-auth";
import { isApiClientError } from "@/lib/api/envelope";
import { LEGACY_APP_STORAGE_KEYS } from "@/lib/app/legacy-storage-keys";
import type { User } from "@/types";

export type AppAuthStatus = "idle" | "loading" | "ready";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  status: AppAuthStatus;
  capabilities: AppMe["capabilities"] | null;
  image: string | null;
  bootstrap: () => Promise<void>;
  setSessionFromMe: (me: AppMe) => void;
  clearLocalSession: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateResidence: (
    provinceId: string,
    cityId: string,
  ) => Promise<void>;
}

function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_APP_STORAGE_KEYS.auth);
  } catch {
    // ignore quota / private mode
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  status: "idle",
  capabilities: null,
  image: null,

  clearLocalSession: () => {
    set({
      capabilities: null,
      image: null,
      isAuthenticated: false,
      user: null,
    });
  },

  setSessionFromMe: (me) => {
    set({
      capabilities: me.capabilities,
      image: me.image,
      isAuthenticated: true,
      status: "ready",
      user: mapAppMeToUser(me),
    });
  },

  bootstrap: async () => {
    clearLegacyAuthStorage();
    set({ status: "loading" });

    try {
      console.log("E2E-TRACE: bootstrap calling fetchAppMe");
      const me = await fetchAppMe();
      console.log("E2E-TRACE: fetchAppMe resolved");
      get().setSessionFromMe(me);
    } catch (cause: unknown) {
      console.log("E2E-TRACE: fetchAppMe rejected", String(cause));
      get().clearLocalSession();
      set({ status: "ready" });

      if (
        isApiClientError(cause) &&
        (cause.status === 401 ||
          cause.code === "AUTH_REQUIRED" ||
          cause.code === "INVALID_SESSION")
      ) {
        return;
      }
      // Soft-fail bootstrap: treat as anonymous; UI can still open /auth.
    }
  },

  refreshMe: async () => {
    const me = await fetchAppMe();
    get().setSessionFromMe(me);
  },

  logout: async () => {
    try {
      await logoutAppSession();
    } finally {
      get().clearLocalSession();
      set({ status: "ready" });
    }
  },

  logoutAll: async () => {
    try {
      await logoutAllAppSessions();
    } finally {
      get().clearLocalSession();
      set({ status: "ready" });
    }
  },

  updateDisplayName: async (name) => {
    const trimmed = name.trim();
    const me = await patchAppMe({ name: trimmed });
    get().setSessionFromMe(me);
  },

  updateResidence: async (provinceId, cityId) => {
    const me = await patchAppMe({ provinceId, cityId });
    get().setSessionFromMe(me);
  },
}));
