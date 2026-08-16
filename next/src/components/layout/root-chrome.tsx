"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { MobileShell } from "@/components/layout/mobile-shell";

interface RootChromeProps {
  children: React.ReactNode;
}

function isAdminPath(pathname: string) {
  return pathname === "/admins" || pathname.startsWith("/admins/");
}

/** Routes admin full-bleed; keeps Mobile Shell only for the consumer/provider app. */
export function RootChrome({ children }: RootChromeProps) {
  const pathname = usePathname();

  if (isAdminPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <MobileShell>
      <AppShell>{children}</AppShell>
    </MobileShell>
  );
}
