import { randomBytes } from "node:crypto";

import { PublicIdSchema } from "@/server/contracts";
import type { PublicId } from "@/server/contracts";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeBase32(value: bigint, length: number): string {
  let encoded = "";
  let remaining = value;

  for (let index = 0; index < length; index += 1) {
    encoded =
      CROCKFORD_BASE32[Number(remaining & BigInt(31))] + encoded;
    remaining >>= BigInt(5);
  }

  return encoded;
}

export function createPublicId(now = Date.now()): PublicId {
  const timestamp = encodeBase32(BigInt(now), 10);
  const randomness = encodeBase32(
    BigInt(`0x${randomBytes(10).toString("hex")}`),
    16,
  );

  return PublicIdSchema.parse(`${timestamp}${randomness}`);
}
