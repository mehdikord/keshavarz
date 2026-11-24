import { createHash } from "node:crypto";

import type { NextRequest } from "next/server";

import { normalizeSearchText } from "@/lib/news/search-text";
import { systemClock } from "@/server/clock/clock";
import { runInTransaction, type TransactionClient } from "@/server/db/transaction";
import { API_ERROR_CODES, ApiError, mapPrismaError } from "@/server/errors";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import { putImage, readValidatedImage, removeImageQuietly, resolveImageStorage } from "@/server/media/image-upload";
import { recordAdminAudit } from "@/server/modules/admin/audit/admin-audit.service";
import {
  countNewsPerImportance,
  deleteNewsRow,
  findNewsByPublicId,
  findNewsIdByLinkHash,
  insertNews,
  listNewsRows,
  updateNewsRow,
} from "@/server/modules/admin/news/news-admin.repository";
import type { NewsCreateInput, NewsListQuery, NewsUpdateInput } from "@/server/modules/admin/news/news-admin.schemas";
import { newsSource } from "@/server/modules/news/news.service";

interface Actor {
  adminId: bigint;
  request?: NextRequest;
}

const MODULE = "news";
const SUBJECT = "news_item";
const IMAGE_PATH = "news";
const SEARCH_TITLE_MAX = 512;
const DUPLICATE_LINK = "خبری با این لینک قبلاً ثبت شده است.";

export interface AdminNewsItem {
  createdAt: string;
  createdBy: string | null;
  id: string;
  image: string;
  /** False: `image` is an external address. */
  imageUploaded: boolean;
  isImportant: boolean;
  link: string;
  source: string;
  title: string;
}

export interface AdminNewsList {
  counts: { all: number; important: number; normal: number };
  items: AdminNewsItem[];
  page: number;
  pageCount: number;
  perPage: number;
  total: number;
}

export async function listAdminNews(query: NewsListQuery): Promise<AdminNewsList> {
  const [{ rows, total }, counts] = await Promise.all([listNewsRows(query), countNewsPerImportance(query.q)]);
  return {
    counts,
    items: rows.map((row) => ({
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdByAdmin?.name ?? null,
      id: row.publicId,
      image: row.image,
      imageUploaded: row.imageKey !== null,
      isImportant: row.isImportant,
      link: row.link,
      source: newsSource(row.link),
      title: row.title,
    })),
    page: query.page,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
    perPage: query.perPage,
    total,
  };
}

const hashLink = (link: string) => createHash("sha256").update(link).digest("hex");
const toSearchTitle = (title: string) => normalizeSearchText(title).slice(0, SEARCH_TITLE_MAX);

function invalidImage(message: string): never {
  throw new ApiError(400, API_ERROR_CODES.validationFailed, message, { fields: { image: [message] } });
}

function duplicateLink(): never {
  throw new ApiError(409, API_ERROR_CODES.conflict, DUPLICATE_LINK, { fields: { link: [DUPLICATE_LINK] } });
}

async function requireNews(transaction: TransactionClient, id: string) {
  const row = await findNewsByPublicId(transaction, id);
  if (!row) throw new ApiError(404, API_ERROR_CODES.notFound, "خبر پیدا نشد.");
  return row;
}

async function assertLinkFree(transaction: TransactionClient, linkHash: string, selfId?: bigint) {
  const owner = await findNewsIdByLinkHash(transaction, linkHash);
  if (owner && owner.id !== selfId) duplicateLink();
}

interface StoredUpload {
  key: string;
  url: string;
}

async function storeUpload(storage: ObjectStorage, file: File): Promise<StoredUpload> {
  const image = await readValidatedImage(file);
  const key = `news-${createPublicId().toLowerCase()}${image.extension}`;
  const url = await putImage(storage, { contentType: image.contentType, data: image.data, key });
  return { key, url };
}

function rethrow(error: unknown): never {
  if (error instanceof ApiError) throw error;
  const mapped = mapPrismaError(error);
  // Two admins saving one link at the same moment: the unique index decides.
  if (mapped?.status === 409) duplicateLink();
  throw mapped ?? error;
}

export async function createAdminNews(
  actor: Actor,
  input: NewsCreateInput,
  file: File | null,
  storage: ObjectStorage = resolveImageStorage(IMAGE_PATH),
): Promise<{ id: string }> {
  const { imageUrl } = input;
  if (!file && !imageUrl) invalidImage("تصویر یا لوگوی خبر را آپلود کنید یا آدرس آن را وارد کنید.");
  if (file && imageUrl) invalidImage("فقط یکی از فایل یا آدرس تصویر را بفرستید.");

  const upload = file ? await storeUpload(storage, file) : null;
  try {
    return await runInTransaction(async (transaction) => {
      const linkHash = hashLink(input.link);
      await assertLinkFree(transaction, linkHash);

      const now = systemClock.now();
      const row = await insertNews(transaction, {
        createdAt: now,
        createdByAdminId: actor.adminId,
        image: (upload?.url ?? imageUrl)!,
        imageKey: upload?.key ?? null,
        isImportant: input.isImportant,
        link: input.link,
        linkHash,
        publicId: createPublicId(now.getTime()),
        searchTitle: toSearchTitle(input.title),
        title: input.title,
        updatedByAdminId: actor.adminId,
      });
      await recordAdminAudit(
        {
          action: "news.create",
          adminId: actor.adminId,
          module: MODULE,
          newValues: { image: row.image, isImportant: row.isImportant, link: row.link, title: row.title },
          request: actor.request,
          subject: { id: row.id, type: SUBJECT },
        },
        transaction,
      );
      return { id: row.publicId };
    });
  } catch (error) {
    if (upload) await removeImageQuietly(storage, upload.key);
    rethrow(error);
  }
}

export async function updateAdminNews(
  actor: Actor,
  id: string,
  input: NewsUpdateInput,
  file: File | null,
  storage: ObjectStorage = resolveImageStorage(IMAGE_PATH),
): Promise<void> {
  const { imageUrl } = input;
  if (file && imageUrl) invalidImage("فقط یکی از فایل یا آدرس تصویر را بفرستید.");
  if (!file && Object.keys(input).length === 0) {
    throw new ApiError(400, API_ERROR_CODES.validationFailed, "هیچ تغییری ارسال نشده است.");
  }

  const upload = file ? await storeUpload(storage, file) : null;
  let replacedKey: string | null;
  try {
    replacedKey = await runInTransaction(async (transaction) => {
      const current = await requireNews(transaction, id);
      const linkHash = input.link === undefined ? undefined : hashLink(input.link);
      if (linkHash) await assertLinkFree(transaction, linkHash, current.id);

      const image = upload?.url ?? imageUrl ?? current.image;
      const imageChanged = image !== current.image;
      const changes = {
        ...(imageChanged ? { image } : {}),
        ...(input.isImportant !== undefined ? { isImportant: input.isImportant } : {}),
        ...(input.link !== undefined ? { link: input.link } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
      };
      const updated = await updateNewsRow(transaction, current.id, {
        ...changes,
        ...(imageChanged ? { imageKey: upload?.key ?? null } : {}),
        ...(linkHash ? { linkHash } : {}),
        ...(input.title !== undefined ? { searchTitle: toSearchTitle(input.title) } : {}),
        updatedByAdminId: actor.adminId,
      });

      const keys = Object.keys(changes) as Array<keyof typeof changes>;
      const onlyImportance = keys.length === 1 && keys[0] === "isImportant";
      await recordAdminAudit(
        {
          action: onlyImportance ? (input.isImportant ? "news.mark_important" : "news.unmark_important") : "news.update",
          adminId: actor.adminId,
          module: MODULE,
          newValues: Object.fromEntries(keys.map((key) => [key, updated[key]])),
          oldValues: Object.fromEntries(keys.map((key) => [key, current[key]])),
          request: actor.request,
          subject: { id: current.id, type: SUBJECT },
        },
        transaction,
      );
      return imageChanged ? current.imageKey : null;
    });
  } catch (error) {
    if (upload) await removeImageQuietly(storage, upload.key);
    rethrow(error);
  }
  // By key, never by URL: an external URL could share its file name with one of our files.
  await removeImageQuietly(storage, replacedKey);
}

export async function deleteAdminNews(
  actor: Actor,
  id: string,
  storage: ObjectStorage = resolveImageStorage(IMAGE_PATH),
): Promise<void> {
  const removedKey = await runInTransaction(async (transaction) => {
    const current = await requireNews(transaction, id);
    await deleteNewsRow(transaction, current.id);
    await recordAdminAudit(
      {
        action: "news.delete",
        adminId: actor.adminId,
        module: MODULE,
        oldValues: { image: current.image, isImportant: current.isImportant, link: current.link, title: current.title },
        request: actor.request,
        subject: { id: current.id, type: SUBJECT },
      },
      transaction,
    );
    return current.imageKey;
  });
  await removeImageQuietly(storage, removedKey);
}
