import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";

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
