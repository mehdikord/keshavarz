"use client";

import { useEffect, useState } from "react";

import { onAppUnauthorized } from "@/lib/api/app-client";
import { LEGACY_APP_STORAGE_KEYS } from "@/lib/app/legacy-storage-keys";
import { useAuthStore } from "@/stores/auth-store";

function redirectToAppAuth() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/admins") || path.startsWith("/auth")) return;
  window.location.assign("/auth");
}

/** Clear legacy domain mock persistence (auth/catalog/lands/requests/provider/notifications). */
function clearLegacyDomainStorage() {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.values(LEGACY_APP_STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/** When `enabled` is false (admin routes), skip app bootstrap and report ready. */
export function useInitializeApp(enabled = true) {
  const [ready, setReady] = useState(false);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);

  useEffect(() => {
    if (!enabled) return;

    return onAppUnauthorized(() => {
      const wasAuthenticated = useAuthStore.getState().isAuthenticated;
      clearLocalSession();
      if (wasAuthenticated) {
        redirectToAppAuth();
      }
    });
  }, [clearLocalSession, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    clearLegacyDomainStorage();

    console.log("E2E-TRACE: useInitializeApp effect running, calling bootstrap");
    void bootstrap()
      .then(() => {
        console.log("E2E-TRACE: bootstrap resolved");
        if (!cancelled) setReady(true);
      })
      .catch((cause: unknown) => {
        console.log("E2E-TRACE: bootstrap rejected", String(cause));
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [bootstrap, enabled]);

  return enabled ? ready : true;
}
