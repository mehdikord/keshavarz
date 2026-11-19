/** Chromium's install event (not in lib.dom yet). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    /** Captured by `public/pwa-install-capture.js` before React hydrates. */
    __keshavarzInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    /** iOS Safari: true when launched from the home screen. */
    standalone?: boolean;
  }
}

/** Dispatched by `public/pwa-install-capture.js` (keep the names in sync). */
export const INSTALL_AVAILABLE_EVENT = "keshavarz:install-available";
export const APP_INSTALLED_EVENT = "keshavarz:app-installed";

export type InstallPlatform = "ios" | "android" | "desktop";

export interface PlatformInfo {
  platform: InstallPlatform;
  /** iOS browser other than Safari (Chrome/Firefox/Edge on iOS 16.4+ can add to home screen too). */
  iosNonSafari: boolean;
  /** Embedded webviews (Instagram, Telegram, …) cannot install a PWA at all. */
  inAppBrowser: boolean;
}

const IN_APP_BROWSER = /FBAN|FBAV|Instagram|Line\/|Telegram|Twitter|Snapchat|LinkedInApp|MicroMessenger|; wv\)/i;

export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop Mac UA; touch support gives it away.
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);

  return {
    platform: ios ? "ios" : android ? "android" : "desktop",
    iosNonSafari: ios && /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(ua),
    inAppBrowser: IN_APP_BROWSER.test(ua),
  };
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}
