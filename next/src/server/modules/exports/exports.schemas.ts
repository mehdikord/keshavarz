import * as z from "zod";

import { IsoUtcDateTimeSchema } from "@/server/contracts";

export const EXPORT_MAX_ROWS = 50_000;
export const EXPORT_TTL_MS = 24 * 60 * 60 * 1000;
export const EXPORT_DOWNLOAD_TTL_SECONDS = 15 * 60;

export const CreateExportSchema = z
  .object({
    domain: z.enum(["payments", "reports"]),
    filters: z
      .object({
        from: IsoUtcDateTimeSchema.optional(),
        status: z
          .enum([
            "initiated",
            "pending",
            "paid",
            "failed",
            "cancelled",
            "partially_refunded",
            "refunded",
          ])
          .optional(),
        to: IsoUtcDateTimeSchema.optional(),
      })
      .strict()
      .default({}),
    format: z.literal("csv").default("csv"),
  })
  .strict();

export const ExportParamsSchema = z
  .object({
    exportId: z
      .string()
      .regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه export معتبر نیست."),
  })
  .strict();
