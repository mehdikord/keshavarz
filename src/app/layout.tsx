import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn/wght.css";

import { ToastProvider } from "@/components/providers/toast-provider";
import { AppProvider } from "@/components/providers/app-provider";
import { RootChrome } from "@/components/layout/root-chrome";
import { PwaRuntime } from "@/components/pwa";
import { APPLE_STARTUP_IMAGES, PWA_BRAND, STATUS_BAR_COLORS } from "@/lib/pwa/config";

import "./globals.css";

export const metadata: Metadata = {
  title: PWA_BRAND.name,
  description: PWA_BRAND.description,
  applicationName: PWA_BRAND.shortName,
  // `app/manifest.ts` is linked automatically as /manifest.webmanifest.
  appleWebApp: {
    capable: true,
    title: PWA_BRAND.shortName,
    // Heroes paint under the status bar and pad themselves with the safe-area inset.
    statusBarStyle: "black-translucent",
    startupImage: APPLE_STARTUP_IMAGES,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    // Next emits only the unprefixed `mobile-web-app-capable`; older iOS needs the
    // prefixed tag for standalone launch and apple-touch-startup-image.
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets content reach the notch / home indicator; insets are padded back per component.
  viewportFit: "cover",
  // Android: the keyboard shrinks the layout so bottom sheets and inputs stay visible.
  interactiveWidget: "resizes-content",
  themeColor: STATUS_BAR_COLORS.field,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Captures Chromium's install event before hydration (see the file). */}
        <script src="/pwa-install-capture.js" async />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AppProvider>
          <RootChrome>{children}</RootChrome>
          <ToastProvider />
        </AppProvider>
        <PwaRuntime />
      </body>
    </html>
  );
}
