function money(value: bigint): number {
  return Number(value);
}

export function mapSubscriptionPlan(plan: {
  code: string;
  description: string | null;
  durationMonths: number;
  features: unknown;
  isRecommended: number;
  name: string;
  priceToman: bigint;
  sortOrder: number;
}) {
  return {
    code: plan.code,
    description: plan.description,
    durationMonths: plan.durationMonths,
    features: plan.features ?? null,
    isRecommended: plan.isRecommended === 1,
    name: plan.name,
    planId: plan.code,
    priceToman: money(plan.priceToman),
    sortOrder: plan.sortOrder,
  };
}

export function mapActiveSubscription(
  subscription: {
    amountToman: bigint;
    endsAt: Date | null;
    planNameSnapshot: string;
    publicId: string;
    source: string;
    startsAt: Date | null;
    status: string;
  },
  now: Date,
) {
  const endsAt = subscription.endsAt;
  const remainingSeconds =
    endsAt && endsAt > now
      ? Math.max(0, Math.floor((endsAt.getTime() - now.getTime()) / 1000))
      : 0;

  return {
    amountToman: money(subscription.amountToman),
    endsAt: endsAt?.toISOString() ?? null,
    planName: subscription.planNameSnapshot,
    remainingSeconds,
    source: subscription.source,
    startsAt: subscription.startsAt?.toISOString() ?? null,
    status: subscription.status,
    subscriptionId: subscription.publicId,
  };
}

export function mapSubscriptionHistoryItem(subscription: {
  amountToman: bigint;
  cancelledAt: Date | null;
  createdAt: Date;
  endsAt: Date | null;
  planNameSnapshot: string;
  publicId: string;
  source: string;
  startsAt: Date | null;
  status: string;
}) {
  return {
    amountToman: money(subscription.amountToman),
    cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
    createdAt: subscription.createdAt.toISOString(),
    endsAt: subscription.endsAt?.toISOString() ?? null,
    planName: subscription.planNameSnapshot,
    source: subscription.source,
    startsAt: subscription.startsAt?.toISOString() ?? null,
    status: subscription.status,
    subscriptionId: subscription.publicId,
  };
}

export function mapPaymentSummary(payment: {
  amountToman: bigint;
  createdAt: Date;
  gateway: string;
  paidAt: Date | null;
  publicId: string;
  status: string;
  subscription?: { publicId: string } | null;
}) {
  return {
    amountToman: money(payment.amountToman),
    createdAt: payment.createdAt.toISOString(),
    gateway: payment.gateway,
    paidAt: payment.paidAt?.toISOString() ?? null,
    paymentId: payment.publicId,
    status: payment.status,
    subscriptionId: payment.subscription?.publicId ?? null,
  };
}

export function mapPaymentDetail(payment: {
  amountToman: bigint;
  authority: string | null;
  createdAt: Date;
  failedAt: Date | null;
  failureCode: string | null;
  failureMessage: string | null;
  gateway: string;
  paidAt: Date | null;
  publicId: string;
  status: string;
  subscription?: { publicId: string; status: string } | null;
  transactionReference: string | null;
}) {
  return {
    amountToman: money(payment.amountToman),
    authority: payment.authority,
    createdAt: payment.createdAt.toISOString(),
    failedAt: payment.failedAt?.toISOString() ?? null,
    failureCode: payment.failureCode,
    failureMessage: payment.failureMessage,
    gateway: payment.gateway,
    paidAt: payment.paidAt?.toISOString() ?? null,
    paymentId: payment.publicId,
    status: payment.status,
    subscriptionId: payment.subscription?.publicId ?? null,
    subscriptionStatus: payment.subscription?.status ?? null,
    transactionReference: payment.transactionReference,
  };
}

export function mapPurchaseResult(input: {
  authority: string;
  paymentPublicId: string;
  redirectUrl: string;
  subscriptionPublicId: string;
}) {
  return {
    authority: input.authority,
    paymentId: input.paymentPublicId,
    redirectUrl: input.redirectUrl,
    subscriptionId: input.subscriptionPublicId,
  };
}

export function mapRefund(refund: {
  amountToman: bigint;
  createdAt: Date;
  id: bigint;
  reason: string;
  status: string;
}) {
  return {
    amountToman: money(refund.amountToman),
    createdAt: refund.createdAt.toISOString(),
    reason: refund.reason,
    refundId: refund.id.toString(),
    status: refund.status,
  };
}
