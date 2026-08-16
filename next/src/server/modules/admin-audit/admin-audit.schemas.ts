import * as z from "zod";

import { IsoUtcDateTimeSchema, PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";

export const AdminAuditLogsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  action: z.string().trim().min(1).max(120).optional(),
  adminId: PublicIdSchema.optional(),
  from: IsoUtcDateTimeSchema.optional(),
  module: z.string().trim().min(1).max(80).optional(),
  to: IsoUtcDateTimeSchema.optional(),
}).superRefine((value, ctx) => {
  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({
      code: "custom",
      message: "بازه زمانی نامعتبر است (from باید قبل از to باشد).",
      path: ["from"],
    });
  }
});

export const AdminAuditLogParamsSchema = z
  .object({
    auditLogId: z
      .string()
      .regex(/^\d+$/, "شناسه audit باید عددی باشد.")
      .refine((value) => {
        try {
          const id = BigInt(value);
          return id > BigInt(0);
        } catch {
          return false;
        }
      }, "شناسه audit معتبر نیست."),
  })
  .strict();
