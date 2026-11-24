import type { NextRequest } from "next/server";
import type * as z from "zod";

import { API_ERROR_CODES, ApiError } from "@/server/errors";
import { parseJsonBody, parseWithSchema } from "@/server/http";
import { readImageFormField } from "@/server/media/image-upload";

/**
 * News is saved in one request so it can never exist without its image: plain
 * JSON, or multipart with the same JSON in `data` and the file in `image`.
 */
export async function readNewsBody<TSchema extends z.ZodType>(
  request: NextRequest,
  schema: TSchema,
): Promise<{ file: File | null; input: z.output<TSchema> }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return { file: null, input: await parseJsonBody(request, schema) };
  }

  // A body can be read once: the clone gives the file (with the shared size limits), the original the fields.
  const copy = request.clone();
  const file = await readImageFormField(request);
  const data = (await copy.formData()).get("data");

  let body: unknown;
  try {
    body = JSON.parse(typeof data === "string" ? data : "");
  } catch {
    throw new ApiError(400, API_ERROR_CODES.invalidJson, "ساختار اطلاعات خبر معتبر نیست.");
  }
  return { file, input: parseWithSchema(schema, body) };
}
