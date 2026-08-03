"use client";

import { useInitializeApp } from "@/hooks/use-initialize-app";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const ready = useInitializeApp();

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--outer-bg)]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="size-10 animate-pulse rounded-full bg-primary/20" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return children;
}
