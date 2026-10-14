import { extname } from "node:path";

import { systemClock } from "@/server/clock/clock";
import { getSecurityEnvironment } from "@/server/config/env";
import { runInTransaction } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import {
  HttpObjectStorage,
  LocalObjectStorage,
  ObjectStorageUnavailableError,
} from "@/server/integrations";
import {
  mapProviderGalleryImage,
  mapProviderProfile,
  mapProviderService,
  mapPublicProviderProfile,
  mapPublicProviderService,
} from "@/server/modules/provider/provider.mapper";
import {
  countActiveProviderServices,
  countProviderGalleryImages,
  countProviderInboxByStatus,
  countUnreadUserNotifications,
  createInitialPriceHistory,
  createPriceChangeHistory,
  createProviderGalleryImage,
  createProviderService,
  deleteProviderGalleryImage,
  findActiveCatalogServiceBySlug,
  findActiveSubscription,
  findProviderGalleryImageByPublicId,
  findProviderProfileByUserId,
  findProviderServiceByServiceSlug,
  findPublicProviderProfileByUserPublicId,
  listActivePublicProviderServices,
  listProviderGalleryImages,
  listProviderServices,
  sumCompletedRevenueThisMonth,
  updateProviderServiceInTransaction,
  updateProviderWorkArea,
  upsertProviderProfile,
} from "@/server/modules/provider/provider.repository";

const MAX_GALLERY_IMAGES = 12;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

function hasValidImageSignature(data: Uint8Array, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (contentType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a
    );
  }
  if (contentType === "image/webp") {
    return (
      String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

function resolveGalleryStorage(): ObjectStorage {
  const environment = getSecurityEnvironment();
  if (
    environment.OBJECT_STORAGE_GATEWAY_URL &&
    environment.OBJECT_STORAGE_GATEWAY_TOKEN
  ) {
    return new HttpObjectStorage(
      environment.OBJECT_STORAGE_GATEWAY_URL,
      environment.OBJECT_STORAGE_GATEWAY_TOKEN,
    );
  }
  return new LocalObjectStorage("providers/gallery");
}

function raiseStorageUnavailable(error: unknown): never {
  throw new ApiError(
    503,
    API_ERROR_CODES.storageServiceUnavailable,
    "سرویس ذخیرهسازی تصویر در دسترس نیست؛ کمی بعد دوباره تلاش کنید.",
    { cause: error },
  );
}

function storageKeyFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").filter(Boolean).at(-1) ?? null;
  } catch {
    return extname(url) ? (url.split("/").at(-1) ?? null) : null;
  }
}

async function buildEligibility(profile: {
  id: bigint;
  isActive: number;
  isAvailable: number;
  workLatitude: unknown;
  workLongitude: unknown;
}) {
  const now = systemClock.now();
  const [subscription, activeServices] = await Promise.all([
    findActiveSubscription(profile.id, now),
    countActiveProviderServices(profile.id),
  ]);

  const missing: string[] = [];
  if (profile.isActive !== 1) missing.push("active");
  if (profile.isAvailable !== 1) missing.push("availability");
  if (profile.workLatitude === null || profile.workLongitude === null) {
    missing.push("workArea");
  }
  if (!subscription) missing.push("subscription");
  if (activeServices === 0) missing.push("services");

  return {
    missing,
    searchable: missing.length === 0,
  };
}

export async function getCurrentProviderProfile(userId: bigint) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }
  return mapProviderProfile(profile, await buildEligibility(profile));
}

export async function upsertCurrentProviderProfile(
  userId: bigint,
  input: { bio?: string | null },
) {
  const profile = await upsertProviderProfile(userId, input.bio);
  return mapProviderProfile(profile, await buildEligibility(profile));
}

export async function patchCurrentProviderWorkArea(
  userId: bigint,
  input: {
    isAvailable?: boolean;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
) {
  const existing = await findProviderProfileByUserId(userId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const nextLatitude =
    input.workLatitude !== undefined
      ? input.workLatitude
      : decimalOrNull(existing.workLatitude);
  const nextLongitude =
    input.workLongitude !== undefined
      ? input.workLongitude
      : decimalOrNull(existing.workLongitude);

  if ((nextLatitude === null) !== (nextLongitude === null)) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "مرکز کار باید هر دو مختصات یا هر دو null باشد.",
    );
  }

  if (
    input.workRadiusKm !== undefined &&
    (input.workRadiusKm < 20 || input.workRadiusKm > 100)
  ) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "شعاع کاری باید بین ۲۰ تا ۱۰۰ کیلومتر باشد.",
    );
  }

  const profile = await updateProviderWorkArea(existing.id, {
    ...(input.isAvailable === undefined
      ? {}
      : { isAvailable: input.isAvailable ? 1 : 0 }),
    ...(input.workLatitude !== undefined
      ? { workLatitude: input.workLatitude }
      : {}),
    ...(input.workLongitude !== undefined
      ? { workLongitude: input.workLongitude }
      : {}),
    ...(input.workRadiusKm !== undefined
      ? { workRadiusKm: input.workRadiusKm }
      : {}),
  });

  return mapProviderProfile(profile, await buildEligibility(profile));
}

function decimalOrNull(
  value: { toString(): string } | string | null,
): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}

export async function listCurrentProviderServices(
  userId: bigint,
  input: { cursor?: string; limit: number },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  let cursorId: bigint | undefined;
  if (input.cursor) {
    const cursor = await findProviderServiceByServiceSlug(
      profile.id,
      input.cursor,
    );
    if (!cursor) {
      throw new ApiError(400, API_ERROR_CODES.validationFailed, "cursor معتبر نیست.");
    }
    cursorId = cursor.id;
  }

  const rows = await listProviderServices({
    cursorId,
    limit: input.limit,
    providerProfileId: profile.id,
  });
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  const last = page.at(-1);

  return {
    items: page.map(mapProviderService),
    meta: {
      hasMore,
      limit: input.limit,
      nextCursor: hasMore && last ? last.service.slug : null,
    },
  };
}

export async function addCurrentProviderService(
  userId: bigint,
  input: {
    description?: string | null;
    priceToman: number;
    pricingUnit: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
    serviceId: string;
  },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const catalogService = await findActiveCatalogServiceBySlug(input.serviceId);
  if (!catalogService) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "خدمت باید از کاتالوگ فعال انتخاب شود.",
    );
  }

  const priceToman = BigInt(input.priceToman);

  try {
    return await runInTransaction(async (transaction) => {
      const created = await createProviderService(transaction, {
        description: input.description,
        priceToman,
        pricingUnit: input.pricingUnit,
        providerProfileId: profile.id,
        serviceId: catalogService.id,
      });
      await createInitialPriceHistory(transaction, {
        changedByUserId: userId,
        newPriceToman: priceToman,
        providerServiceId: created.id,
      });
      return mapProviderService(created);
    });
  } catch (error) {
    const mapped = mapPrismaError(error);
    if (mapped?.code === API_ERROR_CODES.conflict) {
      throw new ApiError(
        409,
        API_ERROR_CODES.conflict,
        "این خدمت قبلاً برای Provider ثبت شده است.",
        { cause: error },
      );
    }
    throw error;
  }
}

export async function updateCurrentProviderService(
  userId: bigint,
  serviceSlug: string,
  input: {
    description?: string | null;
    priceToman?: number;
    pricingUnit?: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
  },
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const existing = await findProviderServiceByServiceSlug(profile.id, serviceSlug);
  if (!existing || existing.isActive !== 1) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت Provider یافت نشد.");
  }

  return runInTransaction(async (transaction) => {
    const nextPrice =
      input.priceToman === undefined
        ? undefined
        : BigInt(input.priceToman);

    if (nextPrice !== undefined && nextPrice !== existing.priceToman) {
      await createPriceChangeHistory(transaction, {
        changedByUserId: userId,
        newPriceToman: nextPrice,
        oldPriceToman: existing.priceToman,
        providerServiceId: existing.id,
      });
    }

    const updated = await updateProviderServiceInTransaction(
      transaction,
      existing.id,
      {
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(nextPrice !== undefined ? { priceToman: nextPrice } : {}),
        ...(input.pricingUnit !== undefined
          ? { pricingUnit: input.pricingUnit }
          : {}),
      },
    );
    return mapProviderService(updated);
  });
}

export async function deactivateCurrentProviderService(
  userId: bigint,
  serviceSlug: string,
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const existing = await findProviderServiceByServiceSlug(profile.id, serviceSlug);
  if (!existing || existing.isActive !== 1) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمت Provider یافت نشد.");
  }

  await runInTransaction(async (transaction) => {
    await updateProviderServiceInTransaction(transaction, existing.id, {
      isActive: 0,
    });
  });

  return { deactivated: true };
}

export async function getCurrentProviderDashboard(userId: bigint) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const now = systemClock.now();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const [
    newRequests,
    inProgressRequests,
    monthlyRevenue,
    unreadNotifications,
    eligibility,
  ] = await Promise.all([
    countProviderInboxByStatus(profile.id, "sent"),
    countProviderInboxByStatus(profile.id, "accepted"),
    sumCompletedRevenueThisMonth(profile.id, monthStart, monthEnd),
    countUnreadUserNotifications(userId),
    buildEligibility(profile),
  ]);

  return {
    counts: {
      inProgressRequests,
      newRequests,
      unreadNotifications,
    },
    monthlyRevenueToman: Number(monthlyRevenue),
    warnings: eligibility.missing,
  };
}

export async function getPublicProviderProfile(providerId: string) {
  const profile = await findPublicProviderProfileByUserPublicId(providerId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "خدمات‌دهنده یافت نشد.");
  }

  const [services, gallery] = await Promise.all([
    listActivePublicProviderServices(profile.id),
    listProviderGalleryImages(profile.id),
  ]);

  return mapPublicProviderProfile(
    profile,
    services.map(mapPublicProviderService),
    gallery.map(mapProviderGalleryImage),
  );
}

export async function listCurrentProviderGallery(userId: bigint) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const gallery = await listProviderGalleryImages(profile.id);
  return {
    gallery: gallery.map(mapProviderGalleryImage),
    maxImages: MAX_GALLERY_IMAGES,
  };
}

export async function uploadCurrentProviderGalleryImage(
  userId: bigint,
  file: File,
  caption?: string | null,
  storage: ObjectStorage = resolveGalleryStorage(),
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const currentCount = await countProviderGalleryImages(profile.id);
  if (currentCount >= MAX_GALLERY_IMAGES) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      `حداکثر ${MAX_GALLERY_IMAGES} تصویر در گالری مجاز است.`,
    );
  }

  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) {
    throw new ApiError(
      415,
      API_ERROR_CODES.unsupportedMediaType,
      "تصویر باید JPEG، PNG یا WebP باشد.",
    );
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(
      413,
      API_ERROR_CODES.payloadTooLarge,
      "حجم تصویر باید حداکثر ۵ مگابایت باشد.",
    );
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(data, file.type)) {
    throw new ApiError(
      415,
      API_ERROR_CODES.unsupportedMediaType,
      "محتوای فایل با نوع تصویر اعلام‌شده سازگار نیست.",
    );
  }

  const publicId = createPublicId();
  const key = `gallery-${publicId}${extension}`;

  let uploaded;
  try {
    uploaded = await storage.put({
      contentType: file.type,
      data,
      key,
    });
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError) {
      raiseStorageUnavailable(error);
    }
    throw error;
  }

  try {
    const created = await createProviderGalleryImage({
      caption: caption?.trim() ? caption.trim() : null,
      providerProfileId: profile.id,
      publicId,
      sortOrder: currentCount,
      url: uploaded.url,
    });
    return mapProviderGalleryImage(created);
  } catch (error) {
    try {
      await storage.delete(key);
    } catch (deleteError) {
      if (deleteError instanceof ObjectStorageUnavailableError) {
        raiseStorageUnavailable(deleteError);
      }
    }
    throw error;
  }
}

export async function deleteCurrentProviderGalleryImage(
  userId: bigint,
  imageId: string,
  storage: ObjectStorage = resolveGalleryStorage(),
) {
  const profile = await findProviderProfileByUserId(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "پروفایل Provider یافت نشد.");
  }

  const existing = await findProviderGalleryImageByPublicId(profile.id, imageId);
  if (!existing) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "تصویر گالری یافت نشد.");
  }

  await deleteProviderGalleryImage(existing.id);

  const key = storageKeyFromUrl(existing.url);
  if (key) {
    try {
      await storage.delete(key);
    } catch (error) {
      if (error instanceof ObjectStorageUnavailableError) {
        raiseStorageUnavailable(error);
      }
      throw error;
    }
  }

  return { deleted: true };
}
