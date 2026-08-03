import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn/wght.css";

import { ToastProvider } from "@/components/providers/toast-provider";
import { AppProvider } from "@/components/providers/app-provider";
import { AppShell } from "@/components/layout/app-shell";
import { MobileShell } from "@/components/layout/mobile-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "کشاورز — پلتفرم خدمات کشاورزی",
  description: "اتصال کشاورزان برای اشتراک‌گذاری ادوات و خدمات کشاورزی",
  applicationName: "کشاورز",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "کشاورز",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2D6A4F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased">
        <AppProvider>
          <MobileShell>
            <AppShell>{children}</AppShell>
          </MobileShell>
          <ToastProvider />
        </AppProvider>
      </body>
    </html>
  );
}
