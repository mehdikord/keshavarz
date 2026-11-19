"use client";

import { create } from "zustand";

import type { BeforeInstallPromptEvent, PlatformInfo } from "@/lib/pwa/platform";

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface PwaState {
  /** Detected on mount; null during SSR / before hydration. */
  platform: PlatformInfo | null;
  /** Running as an installed app (home screen / app window). */
  isStandalone: boolean;
  /** Chromium's deferred install prompt, when the browser offers one. */
  installPrompt: BeforeInstallPromptEvent | null;
  /** A new service worker is installed and waiting for the user's go-ahead. */
  waitingWorker: ServiceWorker | null;
  installSheetOpen: boolean;

  setPlatform: (platform: PlatformInfo) => void;
  setStandalone: (isStandalone: boolean) => void;
  setInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
  setWaitingWorker: (worker: ServiceWorker | null) => void;
  openInstallSheet: () => void;
  closeInstallSheet: () => void;
  /** Shows the native Chromium install dialog; the prompt can be used once. */
  promptInstall: () => Promise<InstallOutcome>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  platform: null,
  isStandalone: false,
  installPrompt: null,
  waitingWorker: null,
  installSheetOpen: false,

  setPlatform: (platform) => set({ platform }),
  setStandalone: (isStandalone) => set({ isStandalone }),
  setInstallPrompt: (installPrompt) => set({ installPrompt }),
  setWaitingWorker: (waitingWorker) => set({ waitingWorker }),
  openInstallSheet: () => set({ installSheetOpen: true }),
  closeInstallSheet: () => set({ installSheetOpen: false }),

  promptInstall: async () => {
    const event = get().installPrompt;
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    set({ installPrompt: null });
    if (typeof window !== "undefined") window.__keshavarzInstallPrompt = null;
    return outcome;
  },
}));

/** Whether offering "install" makes sense in this browser right now. */
export function selectCanOfferInstall(state: PwaState) {
  if (!state.platform || state.isStandalone) return false;
  return Boolean(state.installPrompt) || state.platform.platform === "ios" || state.platform.inAppBrowser;
}
