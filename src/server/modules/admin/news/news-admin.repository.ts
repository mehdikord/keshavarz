import type { Prisma } from "@/generated/prisma/client";
import { searchWords } from "@/lib/news/search-text";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type { NewsListQuery } from "@/server/modules/admin/news/news-admin.schemas";

type Db = TransactionClient | typeof prisma;

const NEWS_SELECT = {
  createdAt: true,
  id: true,
  image: true,
  imageKey: true,
  isImportant: true,
  link: true,
  publicId: true,
  title: true,
} as const;

function newsSearch(q?: string): Prisma.NewsItemWhereInput {
  if (!q) return {};
  const or: Prisma.NewsItemWhereInput[] = [];
  const words = searchWords(q);
  if (words.length) or.push({ AND: words.map((word) => ({ searchTitle: { contains: word } })) });
  // `link` is an ASCII column (MySQL error 3854 otherwise), and LIKE wildcards are not escaped by Prisma.
  if (/^[\x21-\x7e]+$/.test(q)) or.push({ link: { contains: q.replace(/[\\%_]/g, "\\$&") } });
  return or.length ? { OR: or } : { id: { in: [] } };
}

export async function listNewsRows(query: NewsListQuery) {
  const where: Prisma.NewsItemWhereInput = {
    ...newsSearch(query.q),
    ...(query.status === "all" ? {} : { isImportant: query.status === "important" }),
  };
  const [rows, total] = await Promise.all([
    prisma.newsItem.findMany({
      orderBy: { publicId: "desc" },
      select: { ...NEWS_SELECT, createdByAdmin: { select: { name: true } } },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.newsItem.count({ where }),
  ]);
  return { rows, total };
}

export async function countNewsPerImportance(q?: string) {
  const rows = await prisma.newsItem.groupBy({ _count: { _all: true }, by: ["isImportant"], where: newsSearch(q) });
  const important = rows.find((row) => row.isImportant)?._count._all ?? 0;
  const normal = rows.find((row) => !row.isImportant)?._count._all ?? 0;
  return { all: important + normal, important, normal };
}

export async function findNewsByPublicId(db: Db, publicId: string) {
  return db.newsItem.findUnique({ select: NEWS_SELECT, where: { publicId } });
}

export async function findNewsIdByLinkHash(db: Db, linkHash: string) {
  return db.newsItem.findUnique({ select: { id: true }, where: { linkHash } });
}

export async function insertNews(db: Db, data: Prisma.NewsItemUncheckedCreateInput) {
  return db.newsItem.create({ data, select: NEWS_SELECT });
}

export async function updateNewsRow(db: Db, id: bigint, data: Prisma.NewsItemUncheckedUpdateInput) {
  return db.newsItem.update({ data: { ...data, updatedAt: new Date() }, select: NEWS_SELECT, where: { id } });
}

export async function deleteNewsRow(db: Db, id: bigint) {
  await db.newsItem.delete({ where: { id } });
}
