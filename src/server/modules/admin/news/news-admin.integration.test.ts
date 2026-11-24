import { setTimeout as delay } from "node:timers/promises";

import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { highlightTitle, normalizeSearchText, searchWords } from "@/lib/news/search-text";
import { prisma } from "@/server/db/prisma";
import { createPublicId } from "@/server/identifiers/ulid";
import type { ObjectStorage } from "@/server/integrations";
import { readNewsBody } from "@/server/modules/admin/news/news-admin.input";
import {
  NewsCreateSchema,
  NewsListQuerySchema,
  NewsUpdateSchema,
} from "@/server/modules/admin/news/news-admin.schemas";
import {
  createAdminNews,
  deleteAdminNews,
  listAdminNews,
  updateAdminNews,
} from "@/server/modules/admin/news/news-admin.service";
import { NewsFeedQuerySchema } from "@/server/modules/news/news.schemas";
import { getNewsFeed } from "@/server/modules/news/news.service";

const ADMIN_PHONE = "09996200011";
/** In every title and link made here, so assertions and cleanup never touch real news. */
const MARK = "zzagritest";
const HOST = `${MARK}.example.com`;
const IMAGE = "https://cdn.example.com/photo.jpg";

class MemoryStorage implements ObjectStorage {
  readonly files = new Set<string>();
  readonly deleted: string[] = [];
  async put(input: { contentType: string; data: Uint8Array; key: string }) {
    this.files.add(input.key);
    return { url: `/storage/test/${input.key}` };
  }
  async delete(key: string) {
    this.deleted.push(key);
    this.files.delete(key);
  }
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const png = () => new File([PNG], "logo.png", { type: "image/png" });

const input = (path: string, title: string, extra: object = {}) =>
  NewsCreateSchema.parse({ link: `https://${HOST}/${path}`, title: `${title} ${MARK}`, ...extra });
const feed = (q: string, extra: object = {}) => getNewsFeed(NewsFeedQuerySchema.parse({ q, ...extra }));
const adminList = (query: object) => listAdminNews(NewsListQuerySchema.parse(query));

let actor: { adminId: bigint };

async function cleanup() {
  await prisma.newsItem.deleteMany({ where: { link: { contains: HOST } } });
  const admins = await prisma.admin.findMany({ select: { id: true }, where: { phone: ADMIN_PHONE } });
  await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: admins.map((row) => row.id) } } });
  await prisma.admin.deleteMany({ where: { phone: ADMIN_PHONE } });
}

describe("news search text", () => {
  it.each([
    ["كشاورزي", "کشاورزی"],
    ["آب", "اب"],
    ["مسئول", "مسیول"],
    ["۱۴۰۵ ١٢", "1405 12"],
    ["می‌شود", "میشود"],
    ["«گندم»، جو!", "گندم جو"],
    ["قیمتـــ گندمِ", "قیمت گندم"],
  ])("folds %s", (value, expected) => {
    expect(normalizeSearchText(value)).toBe(normalizeSearchText(expected));
  });

  it("splits a query on half-spaces and drops LIKE wildcards", () => {
    expect(searchWords("گندم‌کاران")).toEqual(searchWords("گندم کاران"));
    expect(searchWords("%_\\")).toEqual([]);
  });

  it("highlights whole words and keeps the title intact", () => {
    const parts = highlightTitle("خرید گندم‌کاران آغاز شد", searchWords("گندم"));
    expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual(["گندم‌کاران"]);
    expect(parts.map((part) => part.text).join("")).toBe("خرید گندم‌کاران آغاز شد");
  });
});

describe("news input", () => {
  const link = (value: string) => NewsCreateSchema.safeParse({ link: value, title: "عنوان آزمون" });
  const image = (value: string) => NewsUpdateSchema.safeParse({ imageUrl: value });

  it.each(["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "//evil", "/news", "https://u:p@irna.ir/x", "http://localhost/x", "خبر", ""])(
    "refuses the link %j",
    (value) => {
      expect(link(value).success).toBe(false);
    },
  );

  it("completes a bare domain, strips direction marks and encodes Persian paths", () => {
    expect(link("irna.ir/news/1").data?.link).toBe("https://irna.ir/news/1");
    expect(link("‏https://irna.ir/n‎").data?.link).toBe("https://irna.ir/n");
    expect(link("https://irna.ir/خبر").data?.link).toMatch(/^https:\/\/irna\.ir\/[%0-9A-F]+$/);
  });

  it("accepts only https for image addresses", () => {
    expect(image("https://cdn.example.com/a.png").success).toBe(true);
    expect(image("http://cdn.example.com/a.png").success).toBe(false);
    expect(image("javascript:alert(1)").success).toBe(false);
  });

  it("reads the fields and the file of a multipart body", async () => {
    const form = new FormData();
    form.append("data", JSON.stringify({ link: "https://irna.ir/1", title: "عنوان آزمون" }));
    form.append("image", png());
    const request = new NextRequest("http://localhost/api/admins/v1/news", { body: form, method: "POST" });
    const body = await readNewsBody(request, NewsCreateSchema);
    expect(body.file?.size).toBe(PNG.byteLength);
    expect(body.input).toEqual({ isImportant: false, link: "https://irna.ir/1", title: "عنوان آزمون" });
  });
});

describe.sequential("admin news", () => {
  beforeAll(async () => {
    await cleanup();
    const admin = await prisma.admin.create({
      data: { name: "مدیر اخبار", password: "unused-hash", phone: ADMIN_PHONE, publicId: createPublicId() },
    });
    actor = { adminId: admin.id };
  }, 60_000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  }, 60_000);

  it("needs exactly one image", async () => {
    const storage = new MemoryStorage();
    await expect(createAdminNews(actor, input("none", "بی‌تصویر"), null, storage)).rejects.toMatchObject({
      fields: { image: expect.any(Array) },
    });
    await expect(
      createAdminNews(actor, input("both", "دو تصویر", { imageUrl: IMAGE }), png(), storage),
    ).rejects.toMatchObject({ fields: { image: expect.any(Array) } });
    expect(storage.files.size).toBe(0);
  });

  it("refuses a duplicate link without leaving a file behind, also under a race", async () => {
    const storage = new MemoryStorage();
    await createAdminNews(actor, input("dup", "اول", { imageUrl: IMAGE }), null, storage);
    await expect(createAdminNews(actor, input("dup", "دوم"), png(), storage)).rejects.toMatchObject({
      fields: { link: expect.any(Array) },
    });
    expect(storage.files.size).toBe(0);

    const results = await Promise.allSettled(
      [1, 2, 3].map((n) => createAdminNews(actor, input("race", `همزمان ${n}`), png(), storage)),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    for (const result of results) {
      if (result.status === "rejected") expect(result.reason).toMatchObject({ fields: { link: expect.any(Array) } });
    }
    expect(storage.files.size).toBe(1);
  });

  it("deletes only files it owns", async () => {
    const storage = new MemoryStorage();
    const { id } = await createAdminNews(actor, input("files", "فایل"), png(), storage);
    const [firstKey] = [...storage.files];

    await updateAdminNews(actor, id, NewsUpdateSchema.parse({}), png(), storage);
    expect(storage.deleted).toEqual([firstKey]);
    const [secondKey] = [...storage.files];

    await updateAdminNews(actor, id, NewsUpdateSchema.parse({ imageUrl: IMAGE }), null, storage);
    expect(storage.deleted).toEqual([firstKey, secondKey]);

    // An external address named exactly like one of our files.
    const external = `https://cdn.example.com/${firstKey}`;
    await updateAdminNews(actor, id, NewsUpdateSchema.parse({ imageUrl: external }), null, storage);
    await deleteAdminNews(actor, id, storage);
    expect(storage.deleted).toEqual([firstKey, secondKey]);
  });

  it("edits, marks important and audits", async () => {
    const storage = new MemoryStorage();
    const { id } = await createAdminNews(actor, input("edit", "عنوان قدیم", { imageUrl: IMAGE }), null, storage);
    await updateAdminNews(actor, id, NewsUpdateSchema.parse({ isImportant: true }), null, storage);
    await updateAdminNews(actor, id, NewsUpdateSchema.parse({ title: `زعفران ${MARK}` }), null, storage);

    expect((await feed(`زعفران ${MARK}`)).items).toMatchObject([{ isImportant: true, newsId: id, source: HOST }]);
    expect((await feed(`قدیم ${MARK}`)).items).toEqual([]);
    await expect(updateAdminNews(actor, id, NewsUpdateSchema.parse({}), null, storage)).rejects.toMatchObject({ status: 400 });

    const row = await prisma.newsItem.findUniqueOrThrow({ where: { publicId: id } });
    const actions = await prisma.adminAuditLog.findMany({ where: { auditableId: row.id, auditableType: "news_item" } });
    expect(actions.map((entry) => entry.action).sort()).toEqual(["news.create", "news.mark_important", "news.update"]);
  });

  it("searches titles the way people type", async () => {
    await createAdminNews(actor, input("s1", "قيمت كود در بازار آزاد ۱۴۰۵", { imageUrl: IMAGE }), null);
    await createAdminNews(actor, input("s2", "حمایت از پسته‌کاران", { imageUrl: IMAGE }), null);

    for (const q of ["قیمت کود", "ازاد 1405", "کود قیمت"]) expect((await feed(`${q} ${MARK}`)).meta.total).toBe(1);
    for (const q of ["پسته کاران", "پسته‌کاران", "پستهکاران"]) expect((await feed(`${q} ${MARK}`)).meta.total).toBe(1);
    expect((await feed("%")).meta.total).toBe(0);
    expect((await feed("_")).items).toEqual([]);
  });

  it("searches links in the admin list without treating input as wildcards", async () => {
    await createAdminNews(actor, input("a_b%25c", "نشانی", { imageUrl: IMAGE }), null);
    await createAdminNews(actor, input("aXbYc", "نشانی دوم", { imageUrl: IMAGE }), null);
    expect((await adminList({ q: `${HOST}/a_b%25c` })).total).toBe(1);
    expect((await adminList({ q: `${HOST}/a_b` })).total).toBe(1);
    expect((await adminList({ q: "؟؟؟" })).total).toBe(0);
    expect((await adminList({ q: "😀" })).total).toBe(0);
    expect((await adminList({ q: MARK, status: "important" })).items.every((item) => item.isImportant)).toBe(true);
  });

  it("pages newest first, and a cursor survives deleting its row", async () => {
    const ids: string[] = [];
    for (let n = 0; n < 5; n += 1) {
      ids.unshift((await createAdminNews(actor, input(`page${n}`, `صفحهبندی ${n}`, { imageUrl: IMAGE }), null)).id);
      await delay(5);
    }
    const q = `صفحهبندی ${MARK}`;
    const first = await feed(q, { limit: 3 });
    expect(first.items.map((item) => item.newsId)).toEqual(ids.slice(0, 3));
    expect(first.meta).toMatchObject({ hasMore: true, nextCursor: ids[2], total: 5 });

    await deleteAdminNews(actor, ids[2]!, new MemoryStorage());
    const second = await feed(q, { cursor: ids[2], limit: 3 });
    expect(second.items.map((item) => item.newsId)).toEqual(ids.slice(3));
    expect(second.meta).toMatchObject({ hasMore: false, nextCursor: null });
  });
});
