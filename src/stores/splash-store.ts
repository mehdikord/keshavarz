"use client";

import { create } from "zustand";

interface SplashState {
  /** True while the launch splash covers the app (starts true at boot). */
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

/** Lets screens hold one-shot intro animations until the splash has lifted. */
export const useSplashStore = create<SplashState>((set) => ({
  visible: true,
  setVisible: (visible) => set({ visible }),
}));
