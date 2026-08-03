import type { UserSubscription } from "@/types";

export function hasActiveSubscription(
  subscription: UserSubscription | null,
): boolean {
  if (!subscription?.isActive) return false;
  return new Date(subscription.endDate) > new Date();
}
