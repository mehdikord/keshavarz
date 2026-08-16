import { emitAlert } from "@/server/observability/alerts";
import { incrementMetric } from "@/server/observability/metrics";

interface DeadLetterEntry {
  attempts: number;
  enqueuedAt: Date;
  id: string;
  lastError: string;
  payload: unknown;
}

const MAX_ATTEMPTS = 5;
const queue: DeadLetterEntry[] = [];
let sequence = 0;

function nextId(): string {
  sequence += 1;
  return `pdl_${sequence}`;
}

export function enqueuePaymentCallbackDeadLetter(input: {
  error: string;
  payload: unknown;
}): void {
  queue.push({
    attempts: 1,
    enqueuedAt: new Date(),
    id: nextId(),
    lastError: input.error,
    payload: input.payload,
  });
  incrementMetric("payment_dead_letters_total");
  emitAlert("payment_mismatch", {
    error: input.error.slice(0, 200),
    queueSize: queue.length,
  });
}

export function listPaymentCallbackDeadLetters(): DeadLetterEntry[] {
  return [...queue];
}

export function clearPaymentCallbackDeadLettersForTests(): void {
  queue.length = 0;
  sequence = 0;
}

export async function replayPaymentCallbackDeadLetter(
  id: string,
  handler: (payload: unknown) => Promise<void>,
): Promise<{ id: string; status: "replayed" | "requeued" | "dropped" }> {
  const index = queue.findIndex((entry) => entry.id === id);
  if (index < 0) {
    throw new Error("dead_letter_not_found");
  }
  const [entry] = queue.splice(index, 1);
  if (!entry) {
    throw new Error("dead_letter_not_found");
  }

  try {
    await handler(entry.payload);
    return { id, status: "replayed" };
  } catch (error) {
    if (entry.attempts < MAX_ATTEMPTS) {
      queue.push({
        ...entry,
        attempts: entry.attempts + 1,
        lastError: error instanceof Error ? error.message : "unknown_error",
      });
      return { id, status: "requeued" };
    }
    return { id, status: "dropped" };
  }
}

export function drainPaymentCallbackDeadLetters(
  handler: (payload: unknown) => Promise<void>,
): Promise<{ failed: number; processed: number }> {
  return (async () => {
    let processed = 0;
    let failed = 0;
    const pending = queue.splice(0, queue.length);

    for (const entry of pending) {
      try {
        await handler(entry.payload);
        processed += 1;
      } catch (error) {
        failed += 1;
        if (entry.attempts < MAX_ATTEMPTS) {
          queue.push({
            ...entry,
            attempts: entry.attempts + 1,
            lastError:
              error instanceof Error ? error.message : "unknown_error",
          });
        }
      }
    }

    return { failed, processed };
  })();
}
