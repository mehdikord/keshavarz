import * as z from "zod";

import { IsoUtcDateTimeSchema } from "@/server/contracts";

export const DASHBOARD_TIMEZONE = "Asia/Tehran" as const;

export const AdminDashboardQuerySchema = z
  .object({
    from: IsoUtcDateTimeSchema.optional(),
    to: IsoUtcDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.from && value.to && value.from > value.to) {
      ctx.addIssue({
        code: "custom",
        message: "بازه زمانی نامعتبر است (from باید قبل از to باشد).",
        path: ["from"],
      });
    }
  });
