"use client";

import { usePathname } from "next/navigation";

import { useInitializeApp } from "@/hooks/use-initialize-app";

interface AppProviderProps {
  children: React.ReactNode;
}

function isAdminPath(pathname: string) {
  return pathname === "/admins" || pathname.startsWith("/admins/");
}

export function AppProvider({ children }: AppProviderProps) {
  const pathname = usePathname();
  const ready = useInitializeApp(!isAdminPath(pathname));

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
