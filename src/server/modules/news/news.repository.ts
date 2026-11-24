import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

function titleMatches(words: string[]): Prisma.NewsItemWhereInput {
  return words.length ? { AND: words.map((word) => ({ searchTitle: { contains: word } })) } : {};
}

/** Newest first. The ULID is the sort key, so a cursor survives deletion of the row it points at. */
export async function listNewsFeedRows(input: { cursor?: string; take: number; words: string[] }) {
  return prisma.newsItem.findMany({
    orderBy: { publicId: "desc" },
    select: { createdAt: true, image: true, isImportant: true, link: true, publicId: true, title: true },
    take: input.take,
    where: { ...titleMatches(input.words), ...(input.cursor ? { publicId: { lt: input.cursor } } : {}) },
  });
}

export async function countNews(words: string[]) {
  return prisma.newsItem.count({ where: titleMatches(words) });
}
