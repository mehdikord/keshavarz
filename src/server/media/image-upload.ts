import { extname } from "node:path";

import { getSecurityEnvironment } from "@/server/config/env";
import { API_ERROR_CODES, ApiError } from "@/server/errors";
import type { ObjectStorage } from "@/server/integrations";
import {
  HttpObjectStorage,
  LocalObjectStorage,
  ObjectStorageUnavailableError,
} from "@/server/integrations";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => data[index] === byte);
  }
  if (contentType === "image/webp") {
    return (
      String.fromCharCode(...data.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...data.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

/** Checks type, size and magic bytes; returns the bytes and the file extension to store under. */
export async function readValidatedImage(file: File): Promise<{ contentType: string; data: Uint8Array; extension: string }> {
  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) {
    throw new ApiError(415, API_ERROR_CODES.unsupportedMediaType, "تصویر باید JPEG، PNG یا WebP باشد.");
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(413, API_ERROR_CODES.payloadTooLarge, "حجم تصویر باید حداکثر ۵ مگابایت باشد.");
  }
  const data = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(data, file.type)) {
    throw new ApiError(
      415,
      API_ERROR_CODES.unsupportedMediaType,
      "محتوای فایل با نوع تصویر اعلام‌شده سازگار نیست.",
    );
  }
  return { contentType: file.type, data, extension };
}

/** The configured object storage gateway, or local disk under `next/storage/<basePath>`. */
export function resolveImageStorage(basePath: string): ObjectStorage {
  const environment = getSecurityEnvironment();
  if (environment.OBJECT_STORAGE_GATEWAY_URL && environment.OBJECT_STORAGE_GATEWAY_TOKEN) {
    return new HttpObjectStorage(environment.OBJECT_STORAGE_GATEWAY_URL, environment.OBJECT_STORAGE_GATEWAY_TOKEN);
  }
  return new LocalObjectStorage(basePath);
}

export function storageKeyFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").filter(Boolean).at(-1) ?? null;
  } catch {
    return extname(url) ? (url.split("/").at(-1) ?? null) : null;
  }
}

export function storageUnavailable(error: unknown): ApiError {
  return new ApiError(
    503,
    API_ERROR_CODES.storageServiceUnavailable,
    "سرویس ذخیره‌سازی تصویر در دسترس نیست؛ کمی بعد دوباره تلاش کنید.",
    { cause: error },
  );
}

export async function putImage(
  storage: ObjectStorage,
  input: { contentType: string; data: Uint8Array; key: string },
): Promise<string> {
  try {
    return (await storage.put(input)).url;
  } catch (error) {
    if (error instanceof ObjectStorageUnavailableError) throw storageUnavailable(error);
    throw error;
  }
}

/**
 * Removes a stored image by its public URL. Failures are swallowed: an orphaned
 * file is harmless, while failing the request after the DB already changed is not.
 */
export async function removeImageQuietly(storage: ObjectStorage, url: string | null | undefined): Promise<void> {
  const key = url ? storageKeyFromUrl(url) : null;
  if (!key) return;
  try {
    await storage.delete(key);
  } catch {
    // Orphaned file; nothing references it any more.
  }
}

/** Reads the `image` part of a multipart admin/app upload with the same limits everywhere. */
export async function readImageFormField(request: Request, field = "image"): Promise<File> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new ApiError(415, API_ERROR_CODES.unsupportedMediaType, "نوع محتوا باید multipart/form-data باشد.");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES + 1024 * 1024) {
    throw new ApiError(413, API_ERROR_CODES.payloadTooLarge, "حجم درخواست بیش از حد مجاز است.");
  }
  const formData = await request.formData();
  const file = formData.get(field);
  if (!(file instanceof File)) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "فایل تصویر الزامی است.", {
      fields: { [field]: ["فایل تصویر الزامی است."] },
    });
  }
  return file;
}
