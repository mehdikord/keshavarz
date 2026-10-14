import { systemClock } from "@/server/clock/clock";
import {
  cancelPendingSubscription,
  expireDueActiveSubscriptions,
  listStalePendingPayments,
  markPaymentFailed,
} from "@/server/modules/subscriptions/subscriptions.repository";
import { drainPaymentCallbackDeadLetters } from "@/server/modules/payments/payment-dead-letter";
import { handlePaymentGatewayCallback } from "@/server/modules/subscriptions/subscriptions.service";

const STALE_PENDING_MS = 30 * 60 * 1000;

export async function runSubscriptionExpirationJob() {
  const count = await expireDueActiveSubscriptions(systemClock.now());
  return { expired: count };
}

export async function runPaymentReconciliationJob() {
  const now = systemClock.now();
  const cutoff = new Date(now.getTime() - STALE_PENDING_MS);
  const stale = await listStalePendingPayments(cutoff);
  let failed = 0;

  for (const payment of stale) {
    await markPaymentFailed(
      payment.id,
      now,
      "stale_pending",
      "پرداخت معلق بیش از حد مجاز باقی مانده است.",
    );
    if (payment.providerSubscriptionId) {
      await cancelPendingSubscription(
        payment.providerSubscriptionId,
        now,
        "stale_pending",
      );
    }
    failed += 1;
  }

  return { failed, scanned: stale.length };
}

export async function runPaymentDeadLetterDrainJob() {
  return drainPaymentCallbackDeadLetters(async (payload) => {
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
  });
}
