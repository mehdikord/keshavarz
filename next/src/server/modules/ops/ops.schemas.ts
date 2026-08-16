import * as z from "zod";

import { JOB_NAMES } from "@/server/jobs/runner";

export const OpsJobsRunSchema = z
  .object({
    jobs: z
      .array(z.enum(JOB_NAMES))
      .min(1)
      .max(JOB_NAMES.length)
      .default(["all"]),
  })
  .strict();

export const DeadLetterParamsSchema = z
  .object({
    deadLetterId: z.string().trim().min(1).max(64),
  })
  .strict();

export const NotificationDeadLetterParamsSchema = z
  .object({
    deliveryId: z.string().regex(/^\d+$/, "شناسه delivery معتبر نیست."),
  })
  .strict();
