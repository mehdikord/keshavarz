import { extname } from "node:path";

import { getSecurityEnvironment } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import { HttpObjectStorage } from "@/server/integrations";
import { findActiveCityById, findActiveProvinceById } from "@/server/modules/location/location.repository";
import {
  getCurrentUserProfile,
  replaceCurrentUserImage,
  updateCurrentUserProfile,
} from "@/server/modules/app-profile/app-profile.repository";

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

function resolveStorage(): ObjectStorage {
  const environment = getSecurityEnvironment();
  if (
    !environment.OBJECT_STORAGE_GATEWAY_URL ||
    !environment.OBJECT_STORAGE_GATEWAY_TOKEN
  ) {
    throw new Error("Object storage is not configured.");
  }
  return new HttpObjectStorage(
    environment.OBJECT_STORAGE_GATEWAY_URL,
    environment.OBJECT_STORAGE_GATEWAY_TOKEN,
  );
}

function storageKeyFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").filter(Boolean).at(-1) ?? null;
  } catch {
    return extname(url) ? url.split("/").at(-1) ?? null : null;
  }
}

export async function requireCurrentUserProfile(userId: bigint) {
  const profile = await getCurrentUserProfile(userId);
  if (!profile) {
    throw new ApiError(404, API_ERROR_CODES.notFound, "کاربر یافت نشد.");
  }
  return profile;
}

export async function patchCurrentUserProfile(
  userId: bigint,
  data: {
    cityId?: bigint | null;
    locale?: string;
    name?: string;
    provinceId?: bigint | null;
    timezone?: string;
  },
) {
  const mutation: typeof data = { ...data };

  if (mutation.provinceId !== undefined || mutation.cityId !== undefined) {
    const residence = await resolveResidence(
      mutation.provinceId ?? null,
      mutation.cityId ?? null,
    );
    mutation.provinceId = residence.provinceId;
    mutation.cityId = residence.cityId;
  }

  return updateCurrentUserProfile(userId, mutation);
}

async function resolveResidence(
  provinceId: bigint | null,
  cityId: bigint | null,
): Promise<{ cityId: bigint | null; provinceId: bigint | null }> {
  if (provinceId === null && cityId === null) {
    return { cityId: null, provinceId: null };
  }

  if (provinceId === null || cityId === null) {
    throw new ApiError(
      422,
      API_ERROR_CODES.validationFailed,
      "استان و شهر باید با هم انتخاب یا حذف شوند.",
    );
  }

  const city = await findActiveCityById(cityId);
  if (!city) {
    throw new ApiError(422, API_ERROR_CODES.validationFailed, "شهر معتبر نیست.");
  }

  if (city.provinceId !== provinceId) {
    throw new ApiError(
      422,
      API_ERROR_CODES.validationFailed,
      "شهر انتخابی متعلق به استان انتخابشده نیست.",
    );
  }

  const province = await findActiveProvinceById(provinceId);
  if (!province) {
    throw new ApiError(
      422,
      API_ERROR_CODES.validationFailed,
      "استان معتبر نیست.",
    );
  }

  return { provinceId, cityId };
}

export async function uploadCurrentUserImage(
  userId: bigint,
  file: File,
  storage: ObjectStorage = resolveStorage(),
) {
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

  const current = await requireCurrentUserProfile(userId);
  const key = `user-${createPublicId()}${extension}`;
  const uploaded = await storage.put({
    contentType: file.type,
    data,
    key,
  });

  try {
    await replaceCurrentUserImage(userId, uploaded.url);
  } catch (error) {
    await storage.delete(key);
    throw error;
  }

  const oldKey = current.image ? storageKeyFromUrl(current.image) : null;
  if (oldKey) {
    await storage.delete(oldKey);
  }

  return { image: uploaded.url };
}

export async function deleteCurrentUserImage(
  userId: bigint,
  storage: ObjectStorage = resolveStorage(),
): Promise<void> {
  const current = await requireCurrentUserProfile(userId);
  await replaceCurrentUserImage(userId, null);

  const key = current.image ? storageKeyFromUrl(current.image) : null;
  if (key) {
    await storage.delete(key);
  }
}
