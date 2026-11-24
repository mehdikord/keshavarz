import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";

export const NEWS_PAGE_SIZES = [10, 20, 50, 100] as const;
const URL_MAX = 4096;

// Addresses copied from RTL pages often carry invisible direction marks.
const DIRECTION_MARKS = /[‎‏‪-‮⁦-⁩﻿]/g;

/** An absolute web address on a public-looking host, without credentials. */
function parseWebUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password || !url.hostname.includes(".")) return null;
  return url;
}

const cleanUrl = (value: string) => value.replace(DIRECTION_MARKS, "").trim();

const LinkSchema = z.string().transform((value, context) => {
  const cleaned = cleanUrl(value);
  if (!cleaned) {
    context.addIssue({ code: "custom", message: "لینک خبر را وارد کنید." });
    return z.NEVER;
  }
  // «irna.ir/news/1» is a common paste; anything that already has a scheme is left alone.
  const url = parseWebUrl(/^[^:/\s]+\.[^:/\s]+(\/|$)/.test(cleaned) ? `https://${cleaned}` : cleaned);
  if (!url) {
    context.addIssue({ code: "custom", message: "لینک خبر معتبر نیست؛ نشانی کامل صفحه خبر را وارد کنید." });
    return z.NEVER;
  }
  if (url.href.length > URL_MAX) {
    context.addIssue({ code: "custom", message: "لینک خبر بیش از حد طولانی است." });
    return z.NEVER;
  }
  return url.href;
});

const ImageUrlSchema = z.string().transform((value, context) => {
  const url = parseWebUrl(cleanUrl(value));
  if (!url) {
    context.addIssue({ code: "custom", message: "آدرس مستقیم تصویر معتبر نیست." });
    return z.NEVER;
  }
  if (url.protocol !== "https:") {
    // The app is served over https, where browsers block http images.
    context.addIssue({
      code: "custom",
      message: "آدرس تصویر باید با https شروع شود؛ در غیر این صورت تصویر را آپلود کنید.",
    });
    return z.NEVER;
  }
  if (url.href.length > URL_MAX) {
    context.addIssue({ code: "custom", message: "آدرس تصویر بیش از حد طولانی است." });
    return z.NEVER;
  }
  return url.href;
});

const TitleSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .pipe(z.string().min(3, "عنوان خبر باید حداقل ۳ حرف باشد.").max(255, "عنوان خبر حداکثر ۲۵۵ نویسه است."));

export const NewsIdParamsSchema = z.object({ newsId: PublicIdSchema });

/** The image comes either as `imageUrl` here or as a file next to this payload (multipart). */
export const NewsCreateSchema = z
  .object({
    imageUrl: ImageUrlSchema.optional(),
    isImportant: z.boolean().default(false),
    link: LinkSchema,
    title: TitleSchema,
  })
  .strict();
export type NewsCreateInput = z.infer<typeof NewsCreateSchema>;

/** Empty is valid: an edit may replace only the image file. */
export const NewsUpdateSchema = z
  .object({
    imageUrl: ImageUrlSchema.optional(),
    isImportant: z.boolean().optional(),
    link: LinkSchema.optional(),
    title: TitleSchema.optional(),
  })
  .strict();
export type NewsUpdateInput = z.infer<typeof NewsUpdateSchema>;

/** URL-driven filters fall back to defaults instead of failing the page. */
export const NewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (NEWS_PAGE_SIZES as readonly number[]).includes(value))
    .catch(20),
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(["all", "important", "normal"]).catch("all"),
});
export type NewsListQuery = z.infer<typeof NewsListQuerySchema>;
