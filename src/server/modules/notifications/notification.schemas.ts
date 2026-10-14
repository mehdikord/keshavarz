import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import {
  MAX_ADMIN_NOTIFICATION_RECIPIENTS,
  NOTIFICATION_TYPES,
} from "@/server/modules/notifications/notification.types";

export const NotificationsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  readStatus: z.enum(["all", "read", "unread"]).default("all"),
});

export const NotificationParamsSchema = z
  .object({
    notificationId: PublicIdSchema,
  })
  .strict();

export const ReadAllNotificationsSchema = z
  .object({
    until: z
      .string()
      .datetime({ offset: false, message: "زمان باید ISO 8601 و UTC باشد." }),
  })
  .strict();

export const ReadNotificationSchema = z.object({}).strict();

const NotificationTypeSchema = z.enum([
  NOTIFICATION_TYPES.adminBroadcast,
  NOTIFICATION_TYPES.paymentFailed,
  NOTIFICATION_TYPES.paymentPaid,
  NOTIFICATION_TYPES.requestAccepted,
  NOTIFICATION_TYPES.requestCancelled,
  NOTIFICATION_TYPES.requestCompleted,
  NOTIFICATION_TYPES.requestNew,
  NOTIFICATION_TYPES.requestRejected,
  NOTIFICATION_TYPES.subscriptionExpired,
  NOTIFICATION_TYPES.subscriptionGranted,
]);

export const AdminSendNotificationSchema = z
  .object({
    adminIds: z.array(PublicIdSchema).max(MAX_ADMIN_NOTIFICATION_RECIPIENTS).optional(),
    body: z.string().trim().min(1).max(1500),
    channels: z
      .array(z.enum(["in_app", "sms", "push"]))
      .min(1)
      .max(3)
      .default(["in_app"]),
    deepLink: z.string().trim().max(512).nullable().optional(),
    title: z.string().trim().min(1).max(200),
    type: NotificationTypeSchema.default(NOTIFICATION_TYPES.adminBroadcast),
    userIds: z.array(PublicIdSchema).max(MAX_ADMIN_NOTIFICATION_RECIPIENTS).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const users = value.userIds?.length ?? 0;
    const admins = value.adminIds?.length ?? 0;
    if (users + admins === 0) {
      ctx.addIssue({
        code: "custom",
        message: "حداقل یک گیرنده لازم است.",
        path: ["userIds"],
      });
    }
    if (users + admins > MAX_ADMIN_NOTIFICATION_RECIPIENTS) {
      ctx.addIssue({
        code: "custom",
        message: `حداکثر ${MAX_ADMIN_NOTIFICATION_RECIPIENTS} گیرنده مجاز است.`,
        path: ["userIds"],
      });
    }
  });

export const AdminNotificationsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  recipientType: z.enum(["user", "admin"]).optional(),
  type: NotificationTypeSchema.optional(),
});
