import * as z from "zod";

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
} from "@/server/contracts";

export function createCursorPaginationSchema<
  const TSortFields extends readonly [string, ...string[]],
>(sortFields: TSortFields) {
  return z
    .object({
      cursor: z.string().min(1).max(512).optional(),
      direction: z.enum(["asc", "desc"]).default("desc"),
      limit: z.coerce
        .number<number>()
        .int()
        .min(1)
        .max(PAGINATION_MAX_LIMIT)
        .default(PAGINATION_DEFAULT_LIMIT),
      sort: z.enum(sortFields).default(sortFields[0]),
    })
    .strict();
}

export function assertAllowedFilter<
  const TFilters extends readonly string[],
>(
  filterName: string,
  allowedFilters: TFilters,
): asserts filterName is TFilters[number] {
  if (!allowedFilters.includes(filterName)) {
    throw new Error(`Unsupported filter: ${filterName}`);
  }
}
