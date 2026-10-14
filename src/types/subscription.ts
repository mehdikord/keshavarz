export interface SubscriptionPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
}

export interface UserSubscription {
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
