import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { extname } from "node:path";

export const runtime = "nodejs";

const STORAGE_ROOT = resolve(process.cwd(), "next/storage");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const filePath = join(STORAGE_ROOT, ...path);

  const resolvedFilePath = resolve(filePath);
  const resolvedStorageRoot = resolve(STORAGE_ROOT);

  if (!resolvedFilePath.startsWith(resolvedStorageRoot + sep) && resolvedFilePath !== resolvedStorageRoot) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(resolvedFilePath);
    const ext = extname(resolvedFilePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }
    throw error;
  }
}