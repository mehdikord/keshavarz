import type { ObjectStorage } from "@/server/integrations/contracts";

export class ObjectStorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectStorageUnavailableError";
  }
}

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
      throw new ObjectStorageUnavailableError("Object storage is unavailable.");
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

    if (!response.ok) {
      throw new ObjectStorageUnavailableError("Object storage is unavailable.");
    }

    const text = await response.text();
    let payload: PutResponse = {};
    try {
      payload = text ? (JSON.parse(text) as PutResponse) : {};
    } catch {
      throw new ObjectStorageUnavailableError(
        "Object storage returned an invalid response.",
      );
    }

    if (!payload.url) {
      throw new ObjectStorageUnavailableError(
        "Object storage returned no upload URL.",
      );
    }

    return { url: payload.url };
  }
}
