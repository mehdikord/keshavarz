"use client";

import { usePathname } from "next/navigation";

/** Routes whose hero is light at the top edge (golden harvest, morning sky). */
const LIGHT_TOP_PREFIXES = ["/users", "/auth"];

/**
 * iOS reads `apple-mobile-web-app-status-bar-style` once at launch, so the
 * translucent bar always has white text. On light heroes that text would vanish;
 * this scrim tints just the status-bar strip. Its height is the top safe-area
 * inset, which is 0 everywhere except an installed iOS app — so it is inert in
 * browsers and on Android.
 */
export function StatusBarScrim() {
  const pathname = usePathname();
  const lightTop = LIGHT_TOP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!lightTop) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[calc(env(safe-area-inset-top,0px)*1.25)] bg-[linear-gradient(180deg,rgba(15,51,36,0.72)_0%,rgba(15,51,36,0.5)_70%,rgba(15,51,36,0)_100%)]"
    />
  );
}
