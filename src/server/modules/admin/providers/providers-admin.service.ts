import type { NextRequest } from "next/server";

import { systemClock } from "@/server/clock/clock";
import { prisma } from "@/server/db/prisma";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import type { ObjectStorage } from "@/server/integrations";
import { removeImageQuietly, resolveImageStorage } from "@/server/media/image-upload";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countCompletedJobs,
  countProvidersPerTab,
  deleteGalleryImageRow,
  deleteProviderServiceRow,
  findActiveSubscriptionFor,
  findCatalogService,
  findGalleryImage,
  findProviderProfile,
  findProviderServiceByCatalogId,
  findProviderServiceRow,
  insertAdminPriceHistory,
  insertProviderService,
  listGallery,
  listProviderRows,
  listProviderServiceRows,
  listProvinceOptions,
  listServiceOptions,
  listSubscriptionHistory,
  loadProviderActivity,
  lockProviderProfile,
  updateProviderProfileRow,
  updateProviderServiceRow,
} from "@/server/modules/admin/providers/providers-admin.repository";
import {
  PROVIDER_TABS,
  type ProviderProfileUpdateInput,
  type ProviderServiceCreateInput,
  type ProviderServiceUpdateInput,
  type ProviderStatusInput,
  type ProviderWorkAreaInput,
  type ProvidersListQuery,
} from "@/server/modules/admin/providers/providers-admin.schemas";
import { type ProviderEligibilityGap, providerEligibilityMissing } from "@/server/modules/provider/provider.service";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "providers";
const SUBJECT = "provider_profile";
const GALLERY_PATH = "providers/gallery";

const iso = (value: Date | null | undefined) => value?.toISOString() ?? null;
const decimal = (value: { toString(): string } | null) => (value === null ? null : value.toString());

function joinLocation(province?: { name: string } | null, city?: { name: string } | null): string | null {
  const parts = [province?.name, city?.name].filter(Boolean);
  return parts.length ? parts.join("، ") : null;
}

function notFound(): never {
  throw new ApiError(404, API_ERROR_CODES.notFound, "خدمات‌دهنده پیدا نشد.");
}

// =========================================================================== list

export interface AdminProviderListItem {
  approved: boolean;
  completedJobs: number;
  createdAt: string;
  hasWorkArea: boolean;
  id: string;
  image: string | null;
  isActive: boolean;
  isAvailable: boolean;
  location: string | null;
  missing: ProviderEligibilityGap[];
  name: string;
  phone: string;
  servicesCount: number;
  subscription: { endsAt: string | null; planName: string } | null;
  workRadiusKm: number;
}

export interface AdminProviderList {
  counts: Record<(typeof PROVIDER_TABS)[number], number>;
  items: AdminProviderListItem[];
  page: number;
  pageCount: number;
  perPage: number;
  provinces: Array<{ id: string; name: string }>;
  services: AdminCatalogServiceOption[];
  total: number;
}

export interface AdminCatalogServiceOption {
  category: string;
  id: string;
  image: string | null;
  isActive: boolean;
  name: string;
}

export async function getCatalogServiceOptions(): Promise<AdminCatalogServiceOption[]> {
  const rows = await listServiceOptions();
  return rows.map((row) => ({
    category: row.category.name,
    id: row.id.toString(),
    image: row.image,
    isActive: row.isActive === 1,
    name: row.name,
  }));
}

export async function listAdminProviders(query: ProvidersListQuery): Promise<AdminProviderList> {
  const now = systemClock.now();
  const [{ rows, total }, counts, provinces, services] = await Promise.all([
    listProviderRows(query, now),
    countProvidersPerTab(query, now, PROVIDER_TABS),
    listProvinceOptions(),
    getCatalogServiceOptions(),
  ]);
  const completed = await countCompletedJobs(rows.map((row) => row.id));

  return {
    counts,
    items: rows.map((row) => {
      const subscription = row.providerSubscriptions[0] ?? null;
      return {
        approved: row.approvedAt !== null,
        completedJobs: completed.get(row.id.toString()) ?? 0,
        createdAt: row.createdAt.toISOString(),
        hasWorkArea: row.workLatitude !== null && row.workLongitude !== null,
        id: row.user.publicId,
        image: row.user.image,
        isActive: row.isActive === 1,
        isAvailable: row.isAvailable === 1,
        location: joinLocation(row.user.province, row.user.city),
        missing: providerEligibilityMissing({
          activeServices: row._count.providerServices,
          hasActiveSubscription: subscription !== null,
          isActive: row.isActive,
          isAvailable: row.isAvailable,
          workLatitude: row.workLatitude,
          workLongitude: row.workLongitude,
        }),
        name: row.user.name ?? "بدون نام",
        phone: row.user.phone,
        servicesCount: row._count.providerServices,
        subscription: subscription ? { endsAt: iso(subscription.endsAt), planName: subscription.planNameSnapshot } : null,
        workRadiusKm: row.workRadiusKm,
      };
    }),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    provinces: provinces.map((row) => ({ id: row.id.toString(), name: row.name })),
    services,
    total,
  };
}

// ========================================================================= detail

export async function getAdminProviderDetail(publicId: string) {
  const profile = await findProviderProfile(prisma, publicId);
  if (!profile) return null;
  const now = systemClock.now();

  const [services, subscription, subscriptions, gallery, activity, serviceOptions] = await Promise.all([
    listProviderServiceRows(profile.id),
    findActiveSubscriptionFor(prisma, profile.id, now),
    listSubscriptionHistory(profile.id),
    listGallery(profile.id),
    loadProviderActivity(profile.id),
    getCatalogServiceOptions(),
  ]);

  const activeServices = services.filter((row) => row.isActive === 1).length;
  const missing = providerEligibilityMissing({
    activeServices,
    hasActiveSubscription: subscription !== null,
    isActive: profile.isActive,
    isAvailable: profile.isAvailable,
    workLatitude: profile.workLatitude,
    workLongitude: profile.workLongitude,
  });
  const linkCount = (status: string) => activity.links.find((row) => row.status === status)?._count._all ?? 0;
  const jobCount = (status: string) => activity.jobs.find((row) => row.status === status)?._count._all ?? 0;

  return {
    accountDeleted: profile.user.deletedAt !== null,
    approvedAt: iso(profile.approvedAt),
    approvedBy: profile.approvedByAdmin?.name ?? null,
    bio: profile.bio,
    createdAt: profile.createdAt.toISOString(),
    eligibility: { missing, searchable: missing.length === 0 },
    gallery: gallery.map((row) => ({
      caption: row.caption,
      createdAt: row.createdAt.toISOString(),
      id: row.publicId,
      url: row.url,
    })),
    id: profile.user.publicId,
    image: profile.user.image,
    isActive: profile.isActive === 1,
    isAvailable: profile.isAvailable === 1,
    lastLoginAt: iso(profile.user.lastLoginAt),
    location: joinLocation(profile.user.province, profile.user.city),
    name: profile.user.name ?? "بدون نام",
    phone: profile.user.phone,
    recentRequests: activity.recent.map((row) => ({
      consumerName: row.request.consumerNameSnapshot,
      distanceKm: Number(row.distanceKm.toString()),
      landTitle: row.request.landTitleSnapshot,
      linkStatus: row.status,
      priceToman: Number(row.servicePriceSnapshotToman),
      requestId: row.request.publicId,
      requestStatus: row.request.status,
      sentAt: row.sentAt.toISOString(),
      serviceImage: row.request.service.image,
      serviceName: row.request.serviceNameSnapshot,
    })),
    serviceOptions,
    services: services.map((row) => ({
      canDelete: row._count.serviceRequestCandidates === 0 && row._count.serviceRequestProviders === 0,
      catalogActive: row.service.isActive === 1 && row.service.deletedAt === null && row.service.category.isActive === 1,
      catalogServiceId: row.service.id.toString(),
      category: row.service.category.name,
      createdAt: row.createdAt.toISOString(),
      description: row.description,
      id: row.id.toString(),
      image: row.service.image,
      isActive: row.isActive === 1,
      name: row.service.name,
      priceHistory: row.providerServicePriceHistories.map((entry) => ({
        by: entry.changedBy,
        byAdmin: entry.changedByAdmin?.name ?? null,
        createdAt: entry.createdAt.toISOString(),
        newPriceToman: Number(entry.newPriceToman),
        oldPriceToman: entry.oldPriceToman === null ? null : Number(entry.oldPriceToman),
      })),
      priceToman: Number(row.priceToman),
      pricingUnit: row.pricingUnit,
      requestsCount: row._count.serviceRequestProviders,
      updatedAt: row.updatedAt.toISOString(),
    })),
    stats: {
      accepted: linkCount("accepted"),
      cancelledJobs: jobCount("cancelled"),
      completedJobs: jobCount("completed"),
      inProgressJobs: jobCount("in_progress"),
      invitations: activity.links.reduce((sum, row) => sum + row._count._all, 0),
      rejected: linkCount("rejected"),
      revenueToman: Number(activity.revenue),
      waiting: linkCount("sent"),
    },
    subscription: subscription
      ? {
          endsAt: iso(subscription.endsAt),
          id: subscription.publicId,
          planName: subscription.planNameSnapshot,
          source: subscription.source,
          startsAt: iso(subscription.startsAt),
        }
      : null,
    subscriptions: subscriptions.map((row) => ({
      amountToman: Number(row.amountToman),
      cancellationReason: row.cancellationReason,
      cancelledAt: iso(row.cancelledAt),
      createdAt: row.createdAt.toISOString(),
      endsAt: iso(row.endsAt),
      grantedBy: row.grantedByAdmin?.name ?? null,
      id: row.publicId,
      planName: row.planNameSnapshot,
      source: row.source,
      startsAt: iso(row.startsAt),
      status: row.status,
    })),
    workArea: {
      latitude: decimal(profile.workLatitude),
      longitude: decimal(profile.workLongitude),
      radiusKm: profile.workRadiusKm,
    },
  };
}

export type AdminProviderDetail = NonNullable<Awaited<ReturnType<typeof getAdminProviderDetail>>>;
export type AdminProviderService = AdminProviderDetail["services"][number];

// ====================================================================== mutations

async function requireProfile(transaction: TransactionClient, publicId: string) {
  const profile = await findProviderProfile(transaction, publicId);
  if (!profile) notFound();
  await lockProviderProfile(transaction, profile.id);
  return profile;
}

function audit(
  transaction: TransactionClient,
  actor: Actor,
  profileId: bigint,
  input: { action: string; metadata?: Record<string, unknown>; newValues?: Record<string, unknown>; oldValues?: Record<string, unknown> },
) {
  return recordAdminAudit(
    {
      action: input.action,
      adminId: actor.adminId,
      metadata: input.metadata,
      module: MODULE,
      newValues: input.newValues,
      oldValues: input.oldValues,
      request: actor.request,
      subject: { id: profileId, type: SUBJECT },
    },
    transaction,
  );
}

export async function updateAdminProviderProfile(actor: Actor, publicId: string, input: ProviderProfileUpdateInput) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    const data = {
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable ? 1 : 0 } : {}),
    };
    await updateProviderProfileRow(transaction, profile.id, data);
    await audit(transaction, actor, profile.id, {
      action: "providers.update",
      newValues: data,
      oldValues: {
        ...(input.bio !== undefined ? { bio: profile.bio } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: profile.isAvailable } : {}),
      },
    });
  });
}

/** Deactivation takes the provider out of search; existing requests and history stay. */
export async function setAdminProviderStatus(actor: Actor, publicId: string, input: ProviderStatusInput) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    const isActive = input.isActive ? 1 : 0;
    if (profile.isActive === isActive) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        input.isActive ? "این خدمات‌دهنده از قبل فعال است." : "این خدمات‌دهنده از قبل غیرفعال است.",
      );
    }
    await updateProviderProfileRow(transaction, profile.id, { isActive });
    await audit(transaction, actor, profile.id, {
      action: input.isActive ? "providers.activate" : "providers.deactivate",
      metadata: { reason: input.reason },
      newValues: { isActive },
      oldValues: { isActive: profile.isActive },
    });
  });
}

export async function setAdminProviderApproval(actor: Actor, publicId: string, approved: boolean) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    if ((profile.approvedAt !== null) === approved) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        approved ? "این خدمات‌دهنده قبلاً تأیید شده است." : "این خدمات‌دهنده تأیید نشده است.",
      );
    }
    const approvedAt = approved ? systemClock.now() : null;
    await updateProviderProfileRow(transaction, profile.id, {
      approvedAt,
      approvedByAdminId: approved ? actor.adminId : null,
    });
    await audit(transaction, actor, profile.id, {
      action: approved ? "providers.approve" : "providers.unapprove",
      newValues: { approvedAt },
      oldValues: { approvedAt: profile.approvedAt },
    });
  });
}

export async function updateAdminProviderWorkArea(actor: Actor, publicId: string, input: ProviderWorkAreaInput) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    // Same precision as the DB columns (DECIMAL(10,7)).
    const workLatitude = input.workLatitude === null ? null : input.workLatitude.toFixed(7);
    const workLongitude = input.workLongitude === null ? null : input.workLongitude.toFixed(7);
    await updateProviderProfileRow(transaction, profile.id, {
      workLatitude,
      workLongitude,
      workRadiusKm: input.workRadiusKm,
    });
    await audit(transaction, actor, profile.id, {
      action: "providers.work_area",
      newValues: { workLatitude, workLongitude, workRadiusKm: input.workRadiusKm },
      oldValues: {
        workLatitude: decimal(profile.workLatitude),
        workLongitude: decimal(profile.workLongitude),
        workRadiusKm: profile.workRadiusKm,
      },
    });
  });
}

// ----------------------------------------------------------------------- services

async function requireActiveCatalogService(transaction: TransactionClient, serviceId: string) {
  const service = await findCatalogService(transaction, BigInt(serviceId));
  if (!service) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "خدمت انتخاب‌شده در کاتالوگ پیدا نشد.", {
      fields: { serviceId: ["خدمت انتخاب‌شده در کاتالوگ پیدا نشد."] },
    });
  }
  if (service.isActive !== 1 || service.category.isActive !== 1 || service.category.deletedAt !== null) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "این خدمت یا دسته آن در کاتالوگ غیرفعال است.", {
      fields: { serviceId: ["این خدمت یا دسته آن در کاتالوگ غیرفعال است."] },
    });
  }
  return service;
}

/**
 * Adds a catalog service to the provider. A service the provider offered
 * before (now inactive) is switched back on with the new terms instead of
 * duplicated.
 */
export async function addAdminProviderService(
  actor: Actor,
  publicId: string,
  input: ProviderServiceCreateInput,
): Promise<{ id: string; reactivated: boolean }> {
  try {
    return await runInTransaction(async (transaction) => {
      const profile = await requireProfile(transaction, publicId);
      const service = await requireActiveCatalogService(transaction, input.serviceId);
      const priceToman = BigInt(input.priceToman);
      const existing = await findProviderServiceByCatalogId(transaction, profile.id, service.id);

      if (existing?.isActive === 1) {
        throw new ApiError(409, API_ERROR_CODES.conflict, "این خدمت از قبل در فهرست این خدمات‌دهنده است.", {
          fields: { serviceId: ["این خدمت از قبل در فهرست این خدمات‌دهنده است."] },
        });
      }

      let id: bigint;
      if (existing) {
        await updateProviderServiceRow(transaction, existing.id, {
          description: input.description,
          isActive: 1,
          priceToman,
          pricingUnit: input.pricingUnit,
        });
        if (existing.priceToman !== priceToman) {
          await insertAdminPriceHistory(transaction, {
            adminId: actor.adminId,
            newPriceToman: priceToman,
            oldPriceToman: existing.priceToman,
            providerServiceId: existing.id,
            reason: "admin_reactivated",
          });
        }
        id = existing.id;
      } else {
        id = (
          await insertProviderService(transaction, {
            description: input.description,
            priceToman,
            pricingUnit: input.pricingUnit,
            providerProfileId: profile.id,
            serviceId: service.id,
          })
        ).id;
        await insertAdminPriceHistory(transaction, {
          adminId: actor.adminId,
          newPriceToman: priceToman,
          oldPriceToman: null,
          providerServiceId: id,
          reason: "admin_initial_price",
        });
      }

      await audit(transaction, actor, profile.id, {
        action: "providers.services.add",
        metadata: { providerServiceId: id, reactivated: Boolean(existing), service: service.name },
        newValues: { description: input.description, priceToman, pricingUnit: input.pricingUnit },
      });
      return { id: id.toString(), reactivated: Boolean(existing) };
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw mapPrismaError(error) ?? error;
  }
}

export async function updateAdminProviderService(
  actor: Actor,
  publicId: string,
  providerServiceId: string,
  input: ProviderServiceUpdateInput,
) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    const row = await findProviderServiceRow(transaction, profile.id, BigInt(providerServiceId));
    if (!row) throw new ApiError(404, API_ERROR_CODES.notFound, "این خدمت در فهرست خدمات‌دهنده نیست.");

    if (input.isActive === true && row.isActive !== 1) {
      await requireActiveCatalogService(transaction, row.serviceId.toString());
    }

    const priceToman = input.priceToman === undefined ? undefined : BigInt(input.priceToman);
    const data = {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive ? 1 : 0 } : {}),
      ...(priceToman !== undefined ? { priceToman } : {}),
      ...(input.pricingUnit !== undefined ? { pricingUnit: input.pricingUnit } : {}),
    };
    await updateProviderServiceRow(transaction, row.id, data);

    if (priceToman !== undefined && priceToman !== row.priceToman) {
      await insertAdminPriceHistory(transaction, {
        adminId: actor.adminId,
        newPriceToman: priceToman,
        oldPriceToman: row.priceToman,
        providerServiceId: row.id,
        reason: "admin_price_update",
      });
    }

    const onlyStatus = input.isActive !== undefined && Object.keys(data).length === 1;
    await audit(transaction, actor, profile.id, {
      action: onlyStatus
        ? input.isActive
          ? "providers.services.activate"
          : "providers.services.deactivate"
        : "providers.services.update",
      metadata: { providerServiceId: row.id, service: row.service.name },
      newValues: data,
      oldValues: {
        ...(input.description !== undefined ? { description: row.description } : {}),
        ...(input.isActive !== undefined ? { isActive: row.isActive } : {}),
        ...(priceToman !== undefined ? { priceToman: row.priceToman } : {}),
        ...(input.pricingUnit !== undefined ? { pricingUnit: row.pricingUnit } : {}),
      },
    });
  });
}

/** Only a service that never reached a farmer can be removed; otherwise it is deactivated. */
export async function deleteAdminProviderService(actor: Actor, publicId: string, providerServiceId: string) {
  await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    const row = await findProviderServiceRow(transaction, profile.id, BigInt(providerServiceId));
    if (!row) throw new ApiError(404, API_ERROR_CODES.notFound, "این خدمت در فهرست خدمات‌دهنده نیست.");
    if (row._count.serviceRequestCandidates > 0 || row._count.serviceRequestProviders > 0) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "این خدمت در جستجوها یا درخواست‌ها استفاده شده و برای حفظ سوابق قابل حذف نیست؛ آن را غیرفعال کنید.",
      );
    }
    await deleteProviderServiceRow(transaction, row.id);
    await audit(transaction, actor, profile.id, {
      action: "providers.services.delete",
      metadata: { providerServiceId: row.id, service: row.service.name },
      oldValues: { isActive: row.isActive, priceToman: row.priceToman, pricingUnit: row.pricingUnit },
    });
  });
}

// ------------------------------------------------------------------------ gallery

export async function deleteAdminProviderGalleryImage(
  actor: Actor,
  publicId: string,
  imagePublicId: string,
  storage: ObjectStorage = resolveImageStorage(GALLERY_PATH),
) {
  const url = await runInTransaction(async (transaction) => {
    const profile = await requireProfile(transaction, publicId);
    const image = await findGalleryImage(transaction, profile.id, imagePublicId);
    if (!image) throw new ApiError(404, API_ERROR_CODES.notFound, "تصویر پیدا نشد.");
    await deleteGalleryImageRow(transaction, image.id);
    await audit(transaction, actor, profile.id, {
      action: "providers.gallery.delete",
      metadata: { imageId: imagePublicId },
      oldValues: { url: image.url },
    });
    return image.url;
  });
  await removeImageQuietly(storage, url);
}
