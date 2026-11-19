import type { Viewport } from "next";

import { STATUS_BAR_COLORS } from "@/lib/pwa/config";

/** Status bar blends into the morning sky of the farm scene. */
export const viewport: Viewport = {
  themeColor: STATUS_BAR_COLORS.sky,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
