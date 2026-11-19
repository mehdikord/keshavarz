"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { setToasterMounted } from "@/lib/toast";

/**
 * Keeps toasts clear of the status bar / Dynamic Island in the installed app
 * (sonner ignores safe areas) and below the offline pill while it is showing.
 */
function topOffset(base: number, offline: boolean) {
  return `calc(env(safe-area-inset-top, 0px) + ${base + (offline ? 48 : 0)}px)`;
}

export function ToastProvider() {
  const online = useOnlineStatus();

  // Runs after <Toaster>'s own subscription effect, so queued toasts are received.
  useEffect(() => {
    setToasterMounted(true);
    return () => setToasterMounted(false);
  }, []);

  return (
    <Toaster
      dir="rtl"
      position="top-center"
      offset={{ top: topOffset(24, !online) }}
      mobileOffset={{ top: topOffset(12, !online) }}
      duration={3_000}
      toastOptions={{
        duration: 3_000,
        classNames: {
          toast:
            "rounded-xl border border-border bg-surface text-foreground shadow-md font-sans",
          title: "font-medium",
          description: "text-muted-foreground text-sm",
          success: "border-success/30 bg-surface",
          error: "border-destructive/30 bg-surface",
          actionButton: "!h-8 !rounded-lg !bg-primary !px-3 !font-sans !text-[12.5px] !font-bold !text-primary-foreground",
        },
      }}
    />
  );
}
