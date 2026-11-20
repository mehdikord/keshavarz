import * as z from "zod";

const PUBLIC_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const AUDIENCE_KINDS = [
  "user",
  "all",
  "consumers",
  "providers",
  "eligible_providers",
  "providers_without_subscription",
  "province",
] as const;
export type AudienceKind = (typeof AUDIENCE_KINDS)[number];

/**
 * In-app destinations an admin broadcast may open. Every value must pass
 * `sanitizeNotificationDeepLink`; the app maps `/provider/*` to `/providers/*`.
 */
export const ADMIN_BROADCAST_LINKS = [
  "/users/home",
  "/users/search",
  "/users/requests",
  "/users/lands",
  "/users/reports",
  "/provider/home",
  "/provider/requests",
  "/provider/services",
  "/provider/subscription",
  "/provider/reports",
  "/profile",
] as const;

export const AudienceSchema = z
  .object({
    kind: z.enum(AUDIENCE_KINDS),
    provinceId: z.coerce.number().int().positive().optional(),
    userId: z.string().regex(PUBLIC_ID, "کاربر انتخاب‌شده معتبر نیست.").optional(),
  })
  .strict()
  .refine((value) => value.kind !== "user" || Boolean(value.userId), {
    message: "گیرنده را انتخاب کنید.",
    path: ["userId"],
  })
  .refine((value) => value.kind !== "province" || Boolean(value.provinceId), {
    message: "استان را انتخاب کنید.",
    path: ["provinceId"],
  });
export type AudienceInput = z.infer<typeof AudienceSchema>;

export const BroadcastSchema = z
  .object({
    audience: AudienceSchema,
    body: z.string().trim().min(5, "متن اعلان را دست‌کم در ۵ حرف بنویسید.").max(1500, "متن اعلان حداکثر ۱۵۰۰ نویسه است."),
    deepLink: z
      .enum(ADMIN_BROADCAST_LINKS)
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    /** Recipient count the admin saw in the preview; the send is refused if the audience grew a lot meanwhile. */
    expectedRecipients: z.number().int().min(0),
    title: z.string().trim().min(2, "عنوان باید حداقل ۲ حرف باشد.").max(200, "عنوان حداکثر ۲۰۰ نویسه است."),
  })
  .strict();
export type BroadcastInput = z.infer<typeof BroadcastSchema>;

export const PreviewSchema = z.object({ audience: AudienceSchema }).strict();

export const CampaignParamsSchema = z.object({
  campaignId: z.string().regex(PUBLIC_ID, "شناسه ارسال معتبر نیست."),
});

export const DeliveryParamsSchema = z.object({
  deliveryId: z.string().regex(/^[1-9]\d{0,18}$/, "شناسه تحویل معتبر نیست."),
});

export const RecipientSearchSchema = z.object({
  q: z.string().trim().min(2).max(100),
});

export const PERIODS = ["all", "today", "7d", "30d", "90d"] as const;

export const CampaignsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export const CampaignRecipientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  read: z.enum(["all", "read", "unread"]).catch("all"),
});

export const NotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => [10, 20, 50, 100].includes(value))
    .catch(20),
  period: z.enum(PERIODS).catch("all"),
  q: z.string().trim().max(100).optional().catch(undefined),
  read: z.enum(["all", "read", "unread"]).catch("all"),
  recipient: z.enum(["all", "user", "admin"]).catch("all"),
  type: z
    .string()
    .regex(/^[a-z_]{2,80}$/)
    .optional()
    .catch(undefined),
});
export type NotificationsQuery = z.infer<typeof NotificationsQuerySchema>;

export const DeliveriesQuerySchema = z.object({
  channel: z.enum(["all", "in_app", "sms", "push"]).catch("all"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  status: z.enum(["problem", "dead", "retrying", "queued", "skipped", "delivered", "all"]).catch("problem"),
});
export type DeliveriesQuery = z.infer<typeof DeliveriesQuerySchema>;
