import { systemClock } from "@/server/clock/clock";
import {
  listDeadLetterDeliveries,
  listQueuedDeliveries,
  markDeliveryFailed,
  markDeliveryProcessing,
  markDeliverySkipped,
  markDeliverySucceeded,
} from "@/server/modules/notifications/notification.repository";
import { MAX_DELIVERY_ATTEMPTS } from "@/server/modules/notifications/notification.types";

function backoffMilliseconds(attemptsCount: number): number {
  const capped = Math.min(attemptsCount, 6);
  return Math.min(60_000, 1_000 * 2 ** Math.max(0, capped - 1));
}

function isReadyForRetry(item: {
  attemptsCount: number;
  status: string;
  updatedAt: Date;
}, now: Date): boolean {
  if (item.status === "queued") {
    return true;
  }
  if (item.status !== "failed") {
    return false;
  }
  const readyAt = item.updatedAt.getTime() + backoffMilliseconds(item.attemptsCount);
  return readyAt <= now.getTime();
}

async function deliverChannel(input: {
  channel: string;
  notificationPublicId: string;
}): Promise<{ providerMessageId?: string; mode: "delivered" | "skipped" }> {
  if (input.channel === "in_app") {
    return {
      mode: "delivered",
      providerMessageId: `inapp_${input.notificationPublicId}`,
    };
  }

  // SMS/Push providers are optional in this phase; mark as skipped when unset.
  return {
    mode: "skipped",
  };
}

export async function runNotificationDeliveryJob(limit = 50) {
  const now = systemClock.now();
  const queued = await listQueuedDeliveries(limit);
  let delivered = 0;
  let failed = 0;
  let skipped = 0;
  let deferred = 0;

  for (const item of queued) {
    if (!isReadyForRetry(item, now)) {
      deferred += 1;
      continue;
    }

    const attempts = item.attemptsCount + 1;
    await markDeliveryProcessing(item.id, attempts);

    try {
      const result = await deliverChannel({
        channel: item.channel,
        notificationPublicId: item.notification.publicId,
      });

      if (result.mode === "skipped") {
        await markDeliverySkipped(
          item.id,
          now,
          "channel_provider_unavailable",
        );
        skipped += 1;
        continue;
      }

      await markDeliverySucceeded(item.id, now, result.providerMessageId);
      delivered += 1;
    } catch (error) {
      await markDeliveryFailed(
        item.id,
        now,
        error instanceof Error ? error.message : "delivery_failed",
        attempts,
      );
      failed += 1;
    }
  }

  const deadLetters = await listDeadLetterDeliveries(20);

  return {
    deadLetterCount: deadLetters.length,
    deferred,
    delivered,
    failed,
    maxAttempts: MAX_DELIVERY_ATTEMPTS,
    processed: queued.length - deferred,
    skipped,
  };
}
