import { createHmac } from "node:crypto";

import { getSecurityEnvironment } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
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

const SEARCH_TTL_MS = 30 * 60 * 1000;

function pruneExpired(userId: bigint, now: Date): Promise<{ count: number }> {
  return prisma.serviceSearchContext.deleteMany({
    where: { expiresAt: { lte: now }, userId },
  });
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

export async function saveServiceSearchContext(
  context: Omit<ServiceSearchContext, "createdAt" | "expiresAt">,
  now: Date,
): Promise<ServiceSearchContext> {
  await pruneExpired(context.userId, now);

  const stored: ServiceSearchContext = {
    ...context,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SEARCH_TTL_MS),
  };

  await prisma.serviceSearchContext.create({
    data: {
      categoryName: stored.categoryName,
      categorySlug: stored.categorySlug,
      consumerNote: stored.consumerNote,
      criteriaSignature: stored.criteriaSignature,
      dates: stored.dates,
      expiresAt: stored.expiresAt,
      landId: stored.landId,
      landLatitude: stored.landLatitude,
      landLongitude: stored.landLongitude,
      landPublicId: stored.landPublicId,
      landTitle: stored.landTitle,
      publicId: stored.searchId,
      serviceId: stored.serviceId,
      serviceName: stored.serviceName,
      serviceSlug: stored.serviceSlug,
      userId: stored.userId,
    },
  });

  return stored;
}

export async function getServiceSearchContext(
  searchId: string,
  now: Date,
): Promise<ServiceSearchContext | null> {
  const row = await prisma.serviceSearchContext.findUnique({
    where: { publicId: searchId },
  });

  if (!row) {
    return null;
  }

  if (row.expiresAt <= now) {
    await prisma.serviceSearchContext.deleteMany({
      where: { publicId: searchId, userId: row.userId },
    });
    return null;
  }

  const dates = Array.isArray(row.dates)
    ? (row.dates as unknown[]).map((entry) => String(entry))
    : [];

  return {
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    consumerNote: row.consumerNote,
    createdAt: row.createdAt,
    criteriaSignature: row.criteriaSignature,
    dates,
    expiresAt: row.expiresAt,
    landId: row.landId,
    landLatitude: row.landLatitude.toString(),
    landLongitude: row.landLongitude.toString(),
    landPublicId: row.landPublicId,
    landTitle: row.landTitle,
    searchId: row.publicId,
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    serviceSlug: row.serviceSlug,
    userId: row.userId,
  };
}

export async function clearServiceSearchStoreForTests(): Promise<void> {
  await prisma.serviceSearchContext.deleteMany({});
}
