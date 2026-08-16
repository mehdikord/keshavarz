import type { ObjectStorage } from "@/server/integrations/contracts";

interface PutResponse {
  url?: string;
}

export class HttpObjectStorage implements ObjectStorage {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async delete(key: string): Promise<void> {
    const response = await fetch(
      `${this.url}/${encodeURIComponent(key)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.token}` },
        cache: "no-store",
      },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error("Object storage is unavailable.");
    }
  }

  async put(input: {
    contentType: string;
    data: Uint8Array;
    key: string;
  }): Promise<{ url: string }> {
    const response = await fetch(
      `${this.url}/${encodeURIComponent(input.key)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": input.contentType,
        },
        body: Buffer.from(input.data),
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as PutResponse;

    if (!response.ok || !payload.url) {
      throw new Error("Object storage is unavailable.");
    }

    return { url: payload.url };
  }
}
