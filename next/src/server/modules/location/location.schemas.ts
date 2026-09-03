import * as z from "zod";

export const ProvinceIdParamSchema = z.object({
  provinceId: z.coerce
    .bigint()
    .positive()
    .transform((value) => value as bigint),
}).strict();
