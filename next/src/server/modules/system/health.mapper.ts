import * as z from "zod";

import type { HealthResult } from "@/server/modules/system/health.service";

export const HealthResponseSchema = z
  .object({
    checkedAt: z.string().datetime({ offset: true }),
    status: z.literal("ok"),
  })
  .strict();

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export function mapHealthResponse(
  result: HealthResult,
): HealthResponse {
  return HealthResponseSchema.parse({
    checkedAt: result.checkedAt.toISOString(),
    status: result.status,
  });
}
