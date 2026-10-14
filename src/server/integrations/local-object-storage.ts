import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ObjectStorage } from "@/server/integrations/contracts";

const STORAGE_ROOT = resolve(process.cwd(), "next/storage");
const PUBLIC_URL_PREFIX = "/storage";

export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly basePath: string = "users/profile") {}

  private getFullPath(key: string): string {
    return join(STORAGE_ROOT, this.basePath, key);
  }

  private getPublicUrl(key: string): string {
    return `${PUBLIC_URL_PREFIX}/${this.basePath}/${key}`;
  }

  async put(input: {
    contentType: string;
    data: Uint8Array;
    key: string;
  }): Promise<{ url: string }> {
    const fullPath = this.getFullPath(input.key);
    await mkdir(join(fullPath, ".."), { recursive: true });
    await writeFile(fullPath, input.data);
    return { url: this.getPublicUrl(input.key) };
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    try {
      await unlink(fullPath);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== "ENOENT") {
        throw error;
      }
    }
  }
}