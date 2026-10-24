"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig } from "framer-motion";

import { AppSplash } from "@/components/shared/app-splash";
import { useInitializeApp } from "@/hooks/use-initialize-app";

interface AppProviderProps {
  children: React.ReactNode;
}

/** Safety net in case the intro's completion callback never fires. */
const SPLASH_MAX_INTRO_MS = 4000;

function isAdminPath(pathname: string) {
  return pathname === "/admins" || pathname.startsWith("/admins/");
}

export function AppProvider({ children }: AppProviderProps) {
  const pathname = usePathname();
  const isAdmin = isAdminPath(pathname);
  const ready = useInitializeApp(!isAdmin);
  // Keep the splash until its intro has played, so a fast bootstrap doesn't flash it.
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroDone(true), SPLASH_MAX_INTRO_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const showSplash = !isAdmin && (!ready || !introDone);

  return (
    <>
      {ready ? children : null}
      <MotionConfig reducedMotion="user">
        <AnimatePresence>{showSplash ? <AppSplash key="splash" onIntroDone={() => setIntroDone(true)} /> : null}</AnimatePresence>
      </MotionConfig>
    </>
  );
}
