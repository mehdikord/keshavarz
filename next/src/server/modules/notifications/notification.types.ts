export const NOTIFICATION_TYPES = {
  adminBroadcast: "admin_broadcast",
  paymentFailed: "payment_failed",
  paymentPaid: "payment_paid",
  requestAccepted: "request_accepted",
  requestCancelled: "request_cancelled",
  requestCompleted: "request_completed",
  requestNew: "request_new",
  requestRejected: "request_rejected",
  subscriptionExpired: "subscription_expired",
  subscriptionGranted: "subscription_granted",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_CHANNELS = {
  inApp: "in_app",
  push: "push",
  sms: "sms",
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const NOTIFICATION_PAYLOAD_VERSION = 1;

export interface NotificationPayloadData {
  deepLink?: string;
  eventKey: string;
  requestId?: string;
  v: typeof NOTIFICATION_PAYLOAD_VERSION;
}

export const MAX_ADMIN_NOTIFICATION_RECIPIENTS = 50;
export const MAX_DELIVERY_ATTEMPTS = 5;
export const ADMIN_NOTIFICATION_RATE_LIMIT = {
  limit: 20,
  windowMs: 60_000,
} as const;
