import * as z from "zod";

import { IsoUtcDateTimeSchema, PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";

export const AdminUserParamsSchema = z
  .object({
    userId: PublicIdSchema,
  })
  .strict();

export const AdminUsersQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  isActive: z
    .enum(["0", "1"])
    .optional()
    .transform((value) =>
      value === undefined ? undefined : (Number(value) as 0 | 1),
    ),
  q: z.string().trim().min(1).max(120).optional(),
});

export const AdminUserUpdateSchema = z
  .object({
    locale: z.string().trim().min(2).max(10).optional(),
    name: z.string().trim().min(2).max(120).optional(),
    timezone: z.string().trim().min(2).max(64).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminUserModerationActionSchema = z
  .object({
    action: z.enum([
      "activate",
      "deactivate",
      "suspend",
      "ban",
      "unban",
      "warning",
    ]),
    endsAt: IsoUtcDateTimeSchema.optional(),
    reason: z.string().trim().min(1).max(1500),
  })
  .strict();

export const AdminUserModerationActionsQuerySchema =
  createCursorPaginationSchema(["createdAt"] as const);
