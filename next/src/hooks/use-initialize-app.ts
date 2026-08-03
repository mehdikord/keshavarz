"use client";

import { useEffect, useState } from "react";

import { initializeMockData } from "@/lib/mock/sync-user-data";
import { useAuthStore } from "@/stores/auth-store";
import { useCatalogStore } from "@/stores/catalog-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useProviderStore } from "@/stores/provider-store";
import { useRequestStore } from "@/stores/request-store";

export function useInitializeApp() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([
      useAuthStore.persist.rehydrate(),
      useProviderStore.persist.rehydrate(),
      useConsumerStore.persist.rehydrate(),
      useRequestStore.persist.rehydrate(),
      useNotificationStore.persist.rehydrate(),
      useCatalogStore.persist.rehydrate(),
    ]).then(() => {
      initializeMockData();
      setReady(true);
    });
  }, []);

  return ready;
}
