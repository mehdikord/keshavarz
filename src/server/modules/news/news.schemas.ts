import * as z from "zod";

import { PublicIdSchema } from "@/server/contracts";

export const NewsFeedQuerySchema = z.object({
  /** `newsId` of the last item already received. */
  cursor: PublicIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(100).optional(),
});
export type NewsFeedQuery = z.infer<typeof NewsFeedQuerySchema>;
