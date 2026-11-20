import * as z from "zod";

import { IranianMobileSchema } from "@/server/modules/app-auth/app-auth.schemas";

export const USER_STATUSES = ["active", "inactive", "suspended", "banned", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_LIST_SORTS = ["newest", "oldest", "recent_login", "name"] as const;
export const USER_LIST_PAGE_SIZES = [10, 20, 50, 100] as const;

export const USER_DETAIL_TABS = [
  "overview",
  "lands",
  "requests",
  "provider",
  "payments",
  "sessions",
  "notifications",
  "history",
] as const;
export type UserDetailTab = (typeof USER_DETAIL_TABS)[number];

const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * List filters come straight from the URL, so every field falls back to its
 * default instead of failing the page on a hand-edited query string.
 */
export const UsersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => (USER_LIST_PAGE_SIZES as readonly number[]).includes(value))
    .catch(20),
  province: z.coerce.number().int().positive().optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => toLatinDigits(value))
    .optional()
    .catch(undefined),
  role: z.enum(["all", "consumer", "provider"]).catch("all"),
  sort: z.enum(USER_LIST_SORTS).catch("newest"),
  status: z.enum(["all", ...USER_STATUSES]).catch("all"),
});
export type UsersListQuery = z.infer<typeof UsersListQuerySchema>;

export const UserParamsSchema = z.object({
  userId: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه کاربر معتبر نیست."),
});

export const UserNoteParamsSchema = UserParamsSchema.extend({
  noteId: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه یادداشت معتبر نیست."),
});

export const UserUpdateSchema = z
  .object({
    cityId: z.coerce.number().int().positive().nullable(),
    name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد.").max(120, "نام طولانی‌تر از حد مجاز است."),
    phone: IranianMobileSchema,
    provinceId: z.coerce.number().int().positive().nullable(),
  })
  .strict()
  .refine((value) => value.cityId === null || value.provinceId !== null, {
    message: "برای انتخاب شهر، ابتدا استان را انتخاب کنید.",
    path: ["cityId"],
  });
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;

export const MODERATION_ACTIONS = ["activate", "deactivate", "suspend", "ban", "unban", "warning"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const UserModerationSchema = z
  .object({
    action: z.enum(MODERATION_ACTIONS),
    endsAt: z.iso.datetime({ offset: true }).nullable().optional(),
    reason: z
      .string()
      .trim()
      .min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.")
      .max(1500, "دلیل طولانی‌تر از حد مجاز است."),
  })
  .strict()
  .refine((value) => value.action !== "suspend" || Boolean(value.endsAt), {
    message: "برای تعلیق، تاریخ پایان را مشخص کنید.",
    path: ["endsAt"],
  });
export type UserModerationInput = z.infer<typeof UserModerationSchema>;

export const UserSessionsRevokeSchema = z
  .object({
    sessionId: z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/).optional(),
  })
  .strict();

export const UserNoteCreateSchema = z
  .object({
    body: z.string().trim().min(2, "متن یادداشت خالی است.").max(2000, "یادداشت طولانی‌تر از حد مجاز است."),
    isPinned: z.boolean().default(false),
  })
  .strict();

export const UserNoteUpdateSchema = z
  .object({
    isPinned: z.boolean(),
  })
  .strict();

export const UserDeleteSchema = z
  .object({
    reason: z.string().trim().min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.").max(1500),
  })
  .strict();

export const UserRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  status: z
    .enum(["all", "awaiting_send", "pending_provider", "in_progress", "completed", "cancelled"])
    .catch("all"),
});
