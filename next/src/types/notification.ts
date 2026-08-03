export type NotificationType =
  | "request_new"
  | "request_accepted"
  | "request_rejected"
  | "request_completed"
  | "request_cancelled"
  | "subscription_expired";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}
