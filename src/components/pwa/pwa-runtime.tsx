"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import {
  APP_INSTALLED_EVENT,
  INSTALL_AVAILABLE_EVENT,
  detectPlatform,
  isStandaloneDisplay,
} from "@/lib/pwa/platform";
import { whenToasterReady } from "@/lib/toast";
import { usePwaStore } from "@/stores/pwa-store";

const SW_URL = `/sw.js?v=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_VERSION ?? "0")}`;
/** How often a long-lived app session checks for a new deploy. */
const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const UPDATE_TOAST_ID = "pwa-update";

/** Only production registers the worker; dev keeps HMR free of caching. */
const SW_ENABLED = process.env.NODE_ENV === "production";

function offerUpdate(worker: ServiceWorker) {
  usePwaStore.getState().setWaitingWorker(worker);
  whenToasterReady(() => toast("نسخه جدید کشاورز آماده است", {
    id: UPDATE_TOAST_ID,
    description: "برای استفاده از آخرین امکانات، برنامه را به‌روز کنید.",
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: "به‌روزرسانی",
      onClick: () => applyUpdate(),
    },
  }));
}

/** Activates the waiting worker; the `controllerchange` listener then reloads. */
export function applyUpdate() {
  const worker = usePwaStore.getState().waitingWorker;
  if (!worker) return;
  sessionStorage.setItem("keshavarz:pwa-updating", "1");
  worker.postMessage({ type: "SKIP_WAITING" });
}

function trackInstalling(registration: ServiceWorkerRegistration) {
  const worker = registration.installing;
  if (!worker) return;
  worker.addEventListener("statechange", () => {
    // With no controller this is the first install, not an update.
    if (worker.state === "installed" && navigator.serviceWorker.controller) {
      offerUpdate(worker);
    }
  });
}

async function registerServiceWorker(): Promise<(() => void) | undefined> {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/", updateViaCache: "none" });

  if (registration.waiting && navigator.serviceWorker.controller) {
    offerUpdate(registration.waiting);
  }
  trackInstalling(registration);
  registration.addEventListener("updatefound", () => trackInstalling(registration));

  const checkForUpdate = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      registration.update().catch(() => undefined);
    }
  };
  const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", checkForUpdate);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", checkForUpdate);
  };
}

/**
 * Headless PWA runtime: registers the service worker, surfaces deploy updates,
 * and keeps install/display-mode state in `usePwaStore`.
 */
export function PwaRuntime() {
  useEffect(() => {
    const store = usePwaStore.getState();
    store.setPlatform(detectPlatform());
    store.setStandalone(isStandaloneDisplay());
    store.setInstallPrompt(window.__keshavarzInstallPrompt ?? null);

    const onInstallAvailable = () => usePwaStore.getState().setInstallPrompt(window.__keshavarzInstallPrompt ?? null);
    const onInstalled = () => {
      const state = usePwaStore.getState();
      state.setInstallPrompt(null);
      state.closeInstallSheet();
    };
    window.addEventListener(INSTALL_AVAILABLE_EVENT, onInstallAvailable);
    window.addEventListener(APP_INSTALLED_EVENT, onInstalled);

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => usePwaStore.getState().setStandalone(isStandaloneDisplay());
    standaloneQuery.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener(INSTALL_AVAILABLE_EVENT, onInstallAvailable);
      window.removeEventListener(APP_INSTALLED_EVENT, onInstalled);
      standaloneQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (!SW_ENABLED) {
      // A worker left over from a production run would serve stale chunks in dev.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister();
      });
      return;
    }

    if (sessionStorage.getItem("keshavarz:pwa-updating")) {
      sessionStorage.removeItem("keshavarz:pwa-updating");
      whenToasterReady(() => toast.success("کشاورز به‌روز شد"));
    }

    let reloading = false;
    const onControllerChange = () => {
      // Reload only for an update the user accepted, never for the first claim().
      if (reloading || !sessionStorage.getItem("keshavarz:pwa-updating")) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const start = () => {
      registerServiceWorker()
        .then((dispose) => {
          if (cancelled) dispose?.();
          else cleanup = dispose;
        })
        .catch((error: unknown) => console.error("[pwa] service worker registration failed", error));
    };

    // Register after load so the worker's precache never competes with first paint.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      cleanup?.();
      window.removeEventListener("load", start);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
