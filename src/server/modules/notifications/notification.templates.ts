import {
  NOTIFICATION_PAYLOAD_VERSION,
  NOTIFICATION_TYPES,
  type NotificationPayloadData,
  type NotificationType,
} from "@/server/modules/notifications/notification.types";
import { sanitizeNotificationDeepLink } from "@/server/modules/notifications/notification.deeplink";

export function buildNotificationData(input: {
  deepLink?: string | null;
  eventKey: string;
  requestId?: string;
}): NotificationPayloadData {
  const deepLink = sanitizeNotificationDeepLink(input.deepLink);
  return {
    eventKey: input.eventKey,
    v: NOTIFICATION_PAYLOAD_VERSION,
    ...(deepLink ? { deepLink } : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
  };
}

export function buildRequestNotification(input: {
  body: string;
  requestId: string;
  title: string;
  type: NotificationType;
  viewer: "consumer" | "provider";
}): {
  body: string;
  data: NotificationPayloadData;
  title: string;
  type: NotificationType;
} {
  const deepLink =
    input.viewer === "consumer"
      ? `/users/requests/${input.requestId}`
      : `/provider/requests/${input.requestId}`;

  return {
    body: input.body,
    data: buildNotificationData({
      deepLink,
      eventKey: `${input.type}:${input.requestId}`,
      requestId: input.requestId,
    }),
    title: input.title,
    type: input.type,
  };
}

export function buildSubscriptionNotification(input: {
  body: string;
  eventKey: string;
  title: string;
  type:
    | typeof NOTIFICATION_TYPES.subscriptionExpired
    | typeof NOTIFICATION_TYPES.subscriptionGranted;
}): {
  body: string;
  data: NotificationPayloadData;
  title: string;
  type: NotificationType;
} {
  return {
    body: input.body,
    data: buildNotificationData({
      deepLink: "/users/subscription",
      eventKey: input.eventKey,
    }),
    title: input.title,
    type: input.type,
  };
}

export function buildAdminBroadcastNotification(input: {
  body: string;
  deepLink?: string | null;
  eventKey: string;
  title: string;
}): {
  body: string;
  data: NotificationPayloadData;
  title: string;
  type: NotificationType;
} {
  return {
    body: input.body,
    data: buildNotificationData({
      deepLink: input.deepLink,
      eventKey: input.eventKey,
    }),
    title: input.title,
    type: NOTIFICATION_TYPES.adminBroadcast,
  };
}
