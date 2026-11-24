import * as z from "zod";

import { appApi } from "@/lib/api/app-client";

const WEB_URL = /^https?:\/\//i;

export const AppNewsItemSchema = z
  .object({
    image: z.string(),
    isImportant: z.boolean(),
    // Rendered as an href: never anything but a web address.
    link: z.string().regex(WEB_URL),
    newsId: z.string(),
    publishedAt: z.string(),
    source: z.string(),
    title: z.string(),
  })
  .strict();
export type AppNewsItem = z.infer<typeof AppNewsItemSchema>;

const NewsMetaSchema = z.object({ nextCursor: z.string().nullable(), total: z.number().int() });

export interface AppNewsPage {
  items: AppNewsItem[];
  nextCursor: string | null;
  total: number;
}

/** Agriculture news, newest first; `q` searches titles. */
export async function fetchAppNews(
  options: { cursor?: string | null; limit?: number; q?: string; signal?: AbortSignal } = {},
): Promise<AppNewsPage> {
  const result = await appApi.get<unknown>("/news", {
    query: { cursor: options.cursor, limit: options.limit, q: options.q },
    signal: options.signal,
  });
  const { items } = z.object({ items: z.array(AppNewsItemSchema) }).parse(result.data);
  const { nextCursor, total } = NewsMetaSchema.parse(result.meta);
  return { items, nextCursor, total };
}
