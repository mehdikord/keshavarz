import { searchWords } from "@/lib/news/search-text";
import { countNews, listNewsFeedRows } from "@/server/modules/news/news.repository";
import type { NewsFeedQuery } from "@/server/modules/news/news.schemas";

export interface NewsFeedItem {
  image: string;
  isImportant: boolean;
  link: string;
  newsId: string;
  publishedAt: string;
  /** Host of the original site, e.g. `irna.ir`. */
  source: string;
  title: string;
}

export interface NewsFeed {
  items: NewsFeedItem[];
  meta: { hasMore: boolean; limit: number; nextCursor: string | null; total: number };
}

export function newsSource(link: string): string {
  return new URL(link).hostname.replace(/^www\./, "");
}

export async function getNewsFeed({ cursor, limit, q }: NewsFeedQuery): Promise<NewsFeed> {
  const words = q ? searchWords(q) : [];
  // A query made only of symbols matches nothing, rather than everything.
  if (q && words.length === 0) return { items: [], meta: { hasMore: false, limit, nextCursor: null, total: 0 } };

  const [rows, total] = await Promise.all([listNewsFeedRows({ cursor, take: limit + 1, words }), countNews(words)]);
  const page = rows.slice(0, limit);
  const hasMore = rows.length > limit;

  return {
    items: page.map((row) => ({
      image: row.image,
      isImportant: row.isImportant,
      link: row.link,
      newsId: row.publicId,
      publishedAt: row.createdAt.toISOString(),
      source: newsSource(row.link),
      title: row.title,
    })),
    meta: { hasMore, limit, nextCursor: hasMore ? page.at(-1)!.publicId : null, total },
  };
}
