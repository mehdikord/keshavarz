import * as z from "zod";

import type { PublicId } from "@/server/contracts";

export const AuthCheckResponseSchema = z
  .object({
    actorId: z.string(),
    realm: z.enum(["app", "admins"]),
  })
  .strict();

export type AuthCheckResponse = z.infer<
  typeof AuthCheckResponseSchema
>;

export function mapAuthCheckResponse(
  actorId: PublicId,
  realm: "admins" | "app",
): AuthCheckResponse {
  return AuthCheckResponseSchema.parse({ actorId, realm });
}
