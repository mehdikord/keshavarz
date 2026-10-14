import { API_ERROR_CODES, ApiError } from "@/server/errors";
import {
  listNotificationDeadLetters,
  replayNotificationDeadLetter,
} from "@/server/modules/notifications/notification.delivery";
import {
  listPaymentCallbackDeadLetters,
  replayPaymentCallbackDeadLetter,
} from "@/server/modules/payments/payment-dead-letter";
import { handlePaymentGatewayCallback } from "@/server/modules/subscriptions/subscriptions.service";
import { runJobs, type JobName } from "@/server/jobs/runner";
import { getMetricsSnapshot } from "@/server/observability/metrics";
import { getRecentTraces } from "@/server/observability/tracer";

async function paymentReplayHandler(payload: unknown) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("gateway" in payload) ||
    !("authority" in payload) ||
    !("amountToman" in payload) ||
    !("signature" in payload)
  ) {
    throw new Error("invalid_dead_letter_payload");
  }

  const record = payload as {
    amountToman: number;
    authority: string;
    gateway: "mock";
    signature: string;
  };

  if (record.gateway !== "mock") {
    throw new Error("unsupported_gateway");
  }

  await handlePaymentGatewayCallback(record.gateway, {
    amountToman: record.amountToman,
    authority: record.authority,
    signature: record.signature,
  });
}

export async function listPaymentDeadLettersForAdmin() {
  return {
    items: listPaymentCallbackDeadLetters().map((entry) => ({
      attempts: entry.attempts,
      enqueuedAt: entry.enqueuedAt.toISOString(),
      id: entry.id,
      lastError: entry.lastError,
    })),
  };
}

export async function replayPaymentDeadLetterForAdmin(deadLetterId: string) {
  try {
    return await replayPaymentCallbackDeadLetter(
      deadLetterId,
      paymentReplayHandler,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "dead_letter_not_found") {
      throw new ApiError(404, API_ERROR_CODES.notFound, "dead-letter یافت نشد.");
    }
    throw error;
  }
}

export async function listNotificationDeadLettersForAdmin(limit = 100) {
  return {
    items: await listNotificationDeadLetters(limit),
  };
}

export async function replayNotificationDeadLetterForAdmin(deliveryId: string) {
  return replayNotificationDeadLetter(deliveryId);
}

export async function getOpsMetricsForAdmin() {
  return {
    metrics: getMetricsSnapshot(),
    scrapedAt: new Date().toISOString(),
    traces: getRecentTraces(),
  };
}

export async function runOpsJobsForAdmin(jobs: JobName[]) {
  return runJobs(jobs);
}
