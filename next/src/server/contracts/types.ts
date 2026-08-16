import type * as z from "zod";

import type {
  ApiErrorEnvelopeSchema,
  CursorPaginationMetaSchema,
  DecimalStringSchema,
  IdempotencyKeySchema,
  IsoUtcDateTimeSchema,
  MoneyTomanSchema,
  PublicIdSchema,
  RequestIdSchema,
  StrongEtagSchema,
} from "@/server/contracts/schemas";

export interface ApiSuccessEnvelope<
  TData,
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> {
  data: TData;
  meta?: TMeta;
  requestId: RequestId;
}

export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>;
export type CursorPaginationMeta = z.infer<
  typeof CursorPaginationMetaSchema
>;
export type DecimalString = z.infer<typeof DecimalStringSchema>;
export type IdempotencyKey = z.infer<typeof IdempotencyKeySchema>;
export type IsoUtcDateTime = z.infer<typeof IsoUtcDateTimeSchema>;
export type MoneyToman = z.infer<typeof MoneyTomanSchema>;
export type PublicId = z.infer<typeof PublicIdSchema>;
export type RequestId = z.infer<typeof RequestIdSchema>;
export type StrongEtag = z.infer<typeof StrongEtagSchema>;
