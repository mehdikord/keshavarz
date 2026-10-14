import type {
  SmsMessage,
  SmsQueue,
} from "@/server/integrations/contracts";

export class ConsoleSmsQueue implements SmsQueue {
  async enqueue(message: SmsMessage): Promise<{ jobId: string }> {
    const jobId = globalThis.crypto.randomUUID();

    console.info(
      `[sms:dev] to=${message.recipient} body=${message.body} jobId=${jobId}`,
    );

    return { jobId };
  }
}
