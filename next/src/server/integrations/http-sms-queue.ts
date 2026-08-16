import type {
  SmsMessage,
  SmsQueue,
} from "@/server/integrations/contracts";

interface QueueResponse {
  jobId?: string;
}

export class HttpSmsQueue implements SmsQueue {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async enqueue(message: SmsMessage): Promise<{ jobId: string }> {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
      cache: "no-store",
    });
    const payload = (await response.json()) as QueueResponse;

    if (!response.ok || !payload.jobId) {
      throw new Error("SMS queue is unavailable.");
    }

    return { jobId: payload.jobId };
  }
}
