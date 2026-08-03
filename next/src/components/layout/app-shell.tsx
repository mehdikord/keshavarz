"use client";

import { usePathname } from "next/navigation";

import { AppMenu } from "@/components/layout/app-menu";

interface AppShellProps {
  children: React.ReactNode;
}

const HIDDEN_MENU_PATHS = ["/auth"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideMenu = HIDDEN_MENU_PATHS.some((path) => pathname.startsWith(path));

  return (
    <>
      {children}
      {!hideMenu ? <AppMenu /> : null}
    </>
  );
}
