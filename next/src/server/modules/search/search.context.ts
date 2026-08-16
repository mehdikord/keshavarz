import { createHmac } from "node:crypto";

import { getSecurityEnvironment } from "@/server/config/env";
import { stableStringify } from "@/server/idempotency/stable-json";
import { verifyPayloadSignature } from "@/server/security/crypto";

export interface ServiceSearchContext {
  categoryName: string;
  categorySlug: string;
  consumerNote: string | null;
  createdAt: Date;
  criteriaSignature: string;
  dates: string[];
  expiresAt: Date;
  landId: bigint;
  landLatitude: string;
  landLongitude: string;
  landPublicId: string;
  landTitle: string;
  searchId: string;
  serviceId: bigint;
  serviceName: string;
  serviceSlug: string;
  userId: bigint;
}

type StoredSearchContext = ServiceSearchContext;

const SEARCH_TTL_MS = 30 * 60 * 1000;
const store = new Map<string, StoredSearchContext>();

function pruneExpired(now: Date): void {
  for (const [key, value] of store) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function buildSearchCriteriaSignature(input: {
  categorySlug: string;
  consumerNote: string | null;
  dates: string[];
  landPublicId: string;
  serviceSlug: string;
  userId: string;
}): string {
  const secret = getSecurityEnvironment().TOKEN_HASH_SECRET;
  return createHmac("sha256", secret)
    .update(buildSearchCriteriaPayload(input))
    .digest("hex");
}

export function verifySearchCriteriaSignature(
  context: ServiceSearchContext,
): boolean {
  const payload = buildSearchCriteriaPayload({
    categorySlug: context.categorySlug,
    consumerNote: context.consumerNote,
    dates: context.dates,
    landPublicId: context.landPublicId,
    serviceSlug: context.serviceSlug,
    userId: context.userId.toString(),
  });

  return verifyPayloadSignature({
    payload,
    signature: context.criteriaSignature,
  });
}

function buildSearchCriteriaPayload(input: {
  categorySlug: string;
  consumerNote: string | null;
  dates: string[];
  landPublicId: string;
  serviceSlug: string;
  userId: string;
}): string {
  return stableStringify({
    categorySlug: input.categorySlug,
    consumerNote: input.consumerNote,
    dates: [...input.dates].sort(),
    landPublicId: input.landPublicId,
    serviceSlug: input.serviceSlug,
    userId: input.userId,
  });
}

export function saveServiceSearchContext(
  context: Omit<ServiceSearchContext, "createdAt" | "expiresAt">,
  now: Date,
): ServiceSearchContext {
  pruneExpired(now);
  const stored: StoredSearchContext = {
    ...context,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SEARCH_TTL_MS),
  };
  store.set(stored.searchId, stored);
  return stored;
}

export function getServiceSearchContext(
  searchId: string,
  now: Date,
): ServiceSearchContext | null {
  pruneExpired(now);
  const context = store.get(searchId);
  if (!context) {
    return null;
  }
  if (context.expiresAt <= now) {
    store.delete(searchId);
    return null;
  }
  return context;
}

export function clearServiceSearchStoreForTests(): void {
  store.clear();
}
