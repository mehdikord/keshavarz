function money(value: bigint): number {
  return Number(value);
}

export function mapAdminSubscriptionPlan(plan: {
  code: string;
  createdAt: Date;
  deletedAt: Date | null;
  description: string | null;
  durationMonths: number;
  features: unknown;
  isActive: number;
  isRecommended: number;
  name: string;
  priceToman: bigint;
  sortOrder: number;
  updatedAt: Date;
}) {
  return {
    code: plan.code,
    createdAt: plan.createdAt.toISOString(),
    deletedAt: plan.deletedAt?.toISOString() ?? null,
    description: plan.description,
    durationMonths: plan.durationMonths,
    features: plan.features ?? null,
    isActive: plan.isActive === 1,
    isRecommended: plan.isRecommended === 1,
    name: plan.name,
    planId: plan.code,
    priceToman: money(plan.priceToman),
    sortOrder: plan.sortOrder,
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export function mapAdminProviderSubscription(subscription: {
  amountToman: bigint;
  cancelledAt: Date | null;
  createdAt: Date;
  endsAt: Date | null;
  plan: { code: string };
  planNameSnapshot: string;
  providerPublicId: string;
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
    planCode: subscription.plan.code,
    planName: subscription.planNameSnapshot,
    providerId: subscription.providerPublicId,
    source: subscription.source,
    startsAt: subscription.startsAt?.toISOString() ?? null,
    status: subscription.status,
    subscriptionId: subscription.publicId,
  };
}

export function mapAdminPaymentSummary(payment: {
  amountToman: bigint;
  createdAt: Date;
  gateway: string;
  paidAt: Date | null;
  publicId: string;
  status: string;
  subscriptionPublicId: string | null;
  userPublicId: string;
}) {
  return {
    amountToman: money(payment.amountToman),
    createdAt: payment.createdAt.toISOString(),
    gateway: payment.gateway,
    paidAt: payment.paidAt?.toISOString() ?? null,
    paymentId: payment.publicId,
    status: payment.status,
    subscriptionId: payment.subscriptionPublicId,
    userId: payment.userPublicId,
  };
}

export function mapAdminPaymentDetail(payment: {
  amountToman: bigint;
  authority: string | null;
  createdAt: Date;
  failedAt: Date | null;
  failureCode: string | null;
  failureMessage: string | null;
  gateway: string;
  paidAt: Date | null;
  publicId: string;
  refunds: Array<{
    amountToman: bigint;
    createdAt: Date;
    id: bigint;
    reason: string;
    status: string;
  }>;
  status: string;
  subscriptionPublicId: string | null;
  subscriptionStatus: string | null;
  transactionReference: string | null;
  userPublicId: string;
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
    refunds: payment.refunds.map((refund) => ({
      amountToman: money(refund.amountToman),
      createdAt: refund.createdAt.toISOString(),
      reason: refund.reason,
      refundId: refund.id.toString(),
      status: refund.status,
    })),
    status: payment.status,
    subscriptionId: payment.subscriptionPublicId,
    subscriptionStatus: payment.subscriptionStatus,
    transactionReference: payment.transactionReference,
    userId: payment.userPublicId,
  };
}

export function mapAdminRefund(refund: {
  amountToman: bigint;
  createdAt: Date;
  id: bigint;
  paymentPublicId: string;
  processedAt: Date | null;
  reason: string;
  requestedByAdminPublicId: string | null;
  status: string;
}) {
  return {
    amountToman: money(refund.amountToman),
    createdAt: refund.createdAt.toISOString(),
    paymentId: refund.paymentPublicId,
    processedAt: refund.processedAt?.toISOString() ?? null,
    reason: refund.reason,
    refundId: refund.id.toString(),
    requestedByAdminId: refund.requestedByAdminPublicId,
    status: refund.status,
  };
}
