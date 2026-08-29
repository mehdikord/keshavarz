"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      dir="rtl"
      position="top-center"
      duration={3_000}
      pauseOnHover={false}
      toastOptions={{
        duration: 3_000,
        classNames: {
          toast:
            "rounded-xl border border-border bg-surface text-foreground shadow-md font-sans",
          title: "font-medium",
          description: "text-muted-foreground text-sm",
          success: "border-success/30 bg-surface",
          error: "border-destructive/30 bg-surface",
        },
      }}
    />
  );
}
