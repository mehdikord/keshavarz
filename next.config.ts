import { execSync } from "node:child_process";

import type { NextConfig } from "next";

/**
 * Identifies a deploy. The service worker is registered as `/sw.js?v=<id>`, so a
 * new id installs a new worker and the app offers the update in-app.
 * Override with APP_BUILD_ID in CI; otherwise commit SHA + build time.
 */
function resolveAppVersion() {
  if (process.env.APP_BUILD_ID) return process.env.APP_BUILD_ID;
  let sha = "local";
  try {
    sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    // Not a git checkout (e.g. a Docker build context); the timestamp still makes it unique.
  }
  return `${sha}-${Date.now().toString(36)}`;
}

const APP_VERSION = resolveAppVersion();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.weatherapi.com",
        pathname: "/weather/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        // The browser must always revalidate the worker script, or updates stall.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        // Icons and launch screens are not content-hashed: cache, but revalidate.
        source: "/:dir(icons|splash|screenshots)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/storage/:path*",
        destination: "/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
