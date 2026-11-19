import { existsSync } from "node:fs";
import { join } from "node:path";

import type { MetadataRoute } from "next";

import { PWA_BRAND } from "@/lib/pwa/config";

/**
 * Optional store-style screenshots for the richer Android install dialog.
 * Drop PNGs into `public/screenshots/` (1080×1920 narrow, 1920×1080 wide) and
 * they are picked up at build time; missing files are simply left out.
 */
const SCREENSHOTS = [
  { file: "home.png", sizes: "1080x1920", form_factor: "narrow", label: "داشبورد کشاورز" },
  { file: "search.png", sizes: "1080x1920", form_factor: "narrow", label: "جستجوی خدمات کشاورزی" },
  { file: "requests.png", sizes: "1080x1920", form_factor: "narrow", label: "پیگیری درخواست‌ها" },
  { file: "wide.png", sizes: "1920x1080", form_factor: "wide", label: "کشاورز روی دسکتاپ" },
] as const;

function screenshots(): MetadataRoute.Manifest["screenshots"] {
  const dir = join(process.cwd(), "public", "screenshots");
  return SCREENSHOTS.filter(({ file }) => existsSync(join(dir, file))).map(({ file, ...rest }) => ({
    src: `/screenshots/${file}`,
    type: "image/png",
    ...rest,
  }));
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PWA_BRAND.name,
    short_name: PWA_BRAND.shortName,
    description: PWA_BRAND.description,
    lang: "fa-IR",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: PWA_BRAND.themeColor,
    background_color: PWA_BRAND.backgroundColor,
    categories: ["business", "productivity", "utilities"],
    prefer_related_applications: false,
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      {
        name: "جستجوی خدمات",
        short_name: "جستجو",
        description: "یافتن خدمات‌دهنده برای زمین شما",
        url: "/users/search",
        icons: [{ src: "/icons/shortcuts/search.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "درخواست‌های من",
        short_name: "درخواست‌ها",
        description: "پیگیری درخواست‌های ثبت‌شده",
        url: "/users/requests",
        icons: [{ src: "/icons/shortcuts/requests.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "درخواست‌های دریافتی",
        short_name: "صندوق کار",
        description: "درخواست‌های رسیده به خدمات‌دهنده",
        url: "/providers/requests",
        icons: [{ src: "/icons/shortcuts/inbox.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "داشبورد خدمات‌دهنده",
        short_name: "داشبورد",
        url: "/providers/home",
        icons: [{ src: "/icons/shortcuts/dashboard.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    screenshots: screenshots(),
  };
}
