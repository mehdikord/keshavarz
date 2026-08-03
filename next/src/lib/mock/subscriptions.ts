import type { SubscriptionPlan } from "@/types";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-basic",
    name: "اشتراک پایه",
    durationMonths: 1,
    price: 299_000,
  },
  {
    id: "plan-pro",
    name: "اشتراک حرفه‌ای",
    durationMonths: 1,
    price: 499_000,
  },
];

export function getSubscriptionPlanById(planId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId);
}
