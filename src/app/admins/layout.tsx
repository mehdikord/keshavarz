import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import { AdminThemeRoot, type AdminTheme } from "@/components/admin/shell/admin-theme";
import { ADMIN_THEME_COOKIE } from "@/components/admin/shell/constants";

import "./admin-theme.css";

export const metadata: Metadata = {
  description: "کنسول مدیریت پلتفرم خدمات کشاورزی کشاورز",
  robots: { follow: false, index: false },
  title: {
    default: "کنسول مدیریت کشاورز",
    template: "%s · مدیریت کشاورز",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#13291c",
  userScalable: true,
  width: "device-width",
};

function readTheme(value: string | undefined): AdminTheme {
  return value === "light" || value === "dark" ? value : "system";
}

export default async function AdminsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  return (
    <AdminThemeRoot initialTheme={readTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)}>
      {children}
    </AdminThemeRoot>
  );
}
