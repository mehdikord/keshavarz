import "dotenv/config";

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const SEED_WORKER = resolve(process.cwd(), "e2e/helpers/seed-worker.mts");

export interface SeededTokens {
  csrfToken: string;
  sessionToken: string;
}

export interface AppSessionSeed {
  context: import("@playwright/test").BrowserContext;
  land?: {
    areaSquareMeters: string;
    latitude: string;
    longitude: string;
    title: string;
  };
  name?: string;
  phone: string;
}

export interface ProviderSeed {
  context: import("@playwright/test").BrowserContext;
  name?: string;
  phone: string;
  serviceSlug: string;
  workLatitude: string;
  workLongitude: string;
  workRadiusKm?: number;
  priceToman?: number;
}

export interface AdminSessionSeed {
  context: import("@playwright/test").BrowserContext;
  phone: string;
}

const COOKIE_BASE_URL = new URL(
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
);

function runSeed(args: string[]): unknown {
  const result = spawnSync(
    "pnpm",
    ["exec", "tsx", SEED_WORKER, ...args],
    { cwd: process.cwd(), encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(
      `[e2e-seed] ${args.join(" ")} failed:\n${result.stderr || result.stdout}`,
    );
  }

  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return JSON.parse(lines[lines.length - 1]!) as unknown;
}

function runSeedForTokens(args: string[]): SeededTokens {
  const payload = runSeed(args) as Partial<SeededTokens>;
  if (!payload.csrfToken || !payload.sessionToken) {
    throw new Error(
      `[e2e-seed] unexpected worker output for ${args.join(" ")}`,
    );
  }
  return payload as SeededTokens;
}

/**
 * Creates a user + an active app session and injects the session/CSRF cookies
 * into the browser context. OTP itself is covered by API integration tests;
 * UI flows start from an authenticated session.
 */
export async function seedAppSession(
  input: AppSessionSeed,
): Promise<SeededTokens> {
  const args = ["seed-app", "--phone", input.phone];
  if (input.name) {
    args.push("--name", input.name);
  }
  if (input.land) {
    args.push(
      "--land-title",
      input.land.title,
      "--land-lat",
      input.land.latitude,
      "--land-lng",
      input.land.longitude,
      "--land-area",
      input.land.areaSquareMeters,
    );
  }

  const tokens = runSeedForTokens(args);
  await installCookies(input.context, { realm: "app", ...tokens });
  return tokens;
}

/**
 * Creates an eligible provider (profile + service + active subscription) so the
 * consumer search view returns them, and seeds their app session.
 */
export async function seedEligibleProvider(
  input: ProviderSeed,
): Promise<SeededTokens> {
  const args = [
    "seed-provider",
    "--phone",
    input.phone,
    "--service",
    input.serviceSlug,
    "--lat",
    input.workLatitude,
    "--lng",
    input.workLongitude,
  ];
  if (input.name) args.push("--name", input.name);
  if (input.priceToman) args.push("--price", String(input.priceToman));
  if (input.workRadiusKm) args.push("--radius", String(input.workRadiusKm));

  const tokens = runSeedForTokens(args);
  await installCookies(input.context, { realm: "app", ...tokens });
  return tokens;
}

/**
 * Creates a provider user + profile + service WITHOUT a subscription so the
 * purchase flow can be exercised from scratch.
 */
export async function seedProviderForPurchase(
  input: ProviderSeed,
): Promise<SeededTokens> {
  const args = [
    "seed-purchaser",
    "--phone",
    input.phone,
    "--service",
    input.serviceSlug,
    "--lat",
    input.workLatitude,
    "--lng",
    input.workLongitude,
  ];
  if (input.name) args.push("--name", input.name);

  const tokens = runSeedForTokens(args);
  await installCookies(input.context, { realm: "app", ...tokens });
  return tokens;
}

export async function seedAdminSession(
  input: AdminSessionSeed,
): Promise<SeededTokens> {
  const tokens = runSeedForTokens(["seed-admin", "--phone", input.phone]);
  await installCookies(input.context, { realm: "admins", ...tokens });
  return tokens;
}

async function installCookies(
  context: import("@playwright/test").BrowserContext,
  input: {
    csrfToken: string;
    realm: "admins" | "app";
    sessionToken: string;
  },
): Promise<void> {
  const domain = COOKIE_BASE_URL.hostname;
  const prefix = input.realm === "admins" ? "admin" : "app";

  await context.addCookies([
    {
      domain,
      httpOnly: true,
      name: `__Secure-keshavarz_${prefix}_session`,
      path: `/api/${prefix === "admin" ? "admins" : "app"}/v1`,
      sameSite: "Lax",
      secure: true,
      value: input.sessionToken,
    },
    {
      domain,
      httpOnly: false,
      name: `__Secure-keshavarz_${prefix}_csrf`,
      path: "/",
      sameSite: "Lax",
      secure: true,
      value: input.csrfToken,
    },
  ]);
}

export async function cleanupUsers(phones: string[]): Promise<void> {
  runSeed(["cleanup", "--phones", phones.join(",")]);
}
