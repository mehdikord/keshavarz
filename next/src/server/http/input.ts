import type { NextRequest } from "next/server";
import type * as z from "zod";

import {
  API_ERROR_CODES,
  ApiError,
} from "@/server/errors";

const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;

function formatZodFields(
  error: z.ZodError,
): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "_root";
    fields[field] ??= [];
    fields[field].push(issue.message);
  }

  return fields;
}

export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ApiError(
      400,
      API_ERROR_CODES.validationFailed,
      "داده‌های ورودی معتبر نیستند.",
      { fields: formatZodFields(result.error) },
    );
  }

  return result.data;
}

export async function parseJsonBody<TSchema extends z.ZodType>(
  request: NextRequest,
  schema: TSchema,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<z.output<TSchema>> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(
      415,
      API_ERROR_CODES.unsupportedMediaType,
      "نوع محتوای درخواست باید application/json باشد.",
    );
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new ApiError(
      413,
      API_ERROR_CODES.payloadTooLarge,
      "حجم بدنه درخواست بیش از حد مجاز است.",
    );
  }

  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    throw new ApiError(
      413,
      API_ERROR_CODES.payloadTooLarge,
      "حجم بدنه درخواست بیش از حد مجاز است.",
    );
  }

  let body: unknown;

  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiError(
      400,
      API_ERROR_CODES.invalidJson,
      "ساختار JSON معتبر نیست.",
    );
  }

  return parseWithSchema(schema, body);
}

export function searchParamsToObject(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    query[key] = values.length === 1 ? (values[0] ?? "") : values;
  }

  return query;
}

export function parseQuery<TSchema extends z.ZodType>(
  request: NextRequest,
  schema: TSchema,
): z.output<TSchema> {
  return parseWithSchema(
    schema,
    searchParamsToObject(request.nextUrl.searchParams),
  );
}

export async function parseParams<TSchema extends z.ZodType>(
  params: Promise<Record<string, string | string[] | undefined>>,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  return parseWithSchema(schema, await params);
}
