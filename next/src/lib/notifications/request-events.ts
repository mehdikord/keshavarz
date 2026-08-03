import { getServiceById } from "@/lib/mock/catalog";
import { SEED_USERS } from "@/lib/mock/users";
import type { Request, RequestProvider } from "@/types";
import type { NotificationType } from "@/types/notification";

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
}

function getUserName(userId: string): string {
  return SEED_USERS.find((user) => user.id === userId)?.displayName ?? "کاربر";
}

function getServiceName(serviceId: string): string {
  return getServiceById(serviceId)?.name ?? "خدمت";
}

export function buildRequestSentNotification(
  providerId: string,
  request: Request,
): NotificationPayload {
  return {
    userId: providerId,
    title: "درخواست جدید",
    body: `درخواست جدید برای ${getServiceName(request.serviceId)}`,
    type: "request_new",
  };
}

export function buildRequestAcceptedNotification(
  consumerId: string,
  providerId: string,
  request: Request,
): NotificationPayload {
  return {
    userId: consumerId,
    title: "درخواست قبول شد",
    body: `${getUserName(providerId)} درخواست ${getServiceName(request.serviceId)} را قبول کرد`,
    type: "request_accepted",
  };
}

export function buildRequestRejectedNotification(
  consumerId: string,
  providerId: string,
  request: Request,
): NotificationPayload {
  return {
    userId: consumerId,
    title: "درخواست رد شد",
    body: `${getUserName(providerId)} درخواست ${getServiceName(request.serviceId)} را رد کرد`,
    type: "request_rejected",
  };
}

export function buildRequestCompletedNotification(
  providerId: string,
  request: Request,
): NotificationPayload {
  return {
    userId: providerId,
    title: "کار به پایان رسید",
    body: `کار ${getServiceName(request.serviceId)} توسط خدمات‌گیرنده تأیید شد`,
    type: "request_completed",
  };
}

export function buildRequestCancelledNotifications(
  request: Request,
  requestProviders: RequestProvider[],
  cancelledBy: "consumer" | "provider",
): NotificationPayload[] {
  const serviceName = getServiceName(request.serviceId);
  const payloads: NotificationPayload[] = [];
  const seen = new Set<string>();

  const push = (payload: NotificationPayload) => {
    if (seen.has(payload.userId)) return;
    seen.add(payload.userId);
    payloads.push(payload);
  };

  if (request.assignedProviderId) {
    push({
      userId: request.consumerId,
      title: "درخواست لغو شد",
      body: `درخواست ${serviceName} لغو شد`,
      type: "request_cancelled",
    });
    push({
      userId: request.assignedProviderId,
      title: "درخواست لغو شد",
      body: `درخواست ${serviceName} لغو شد`,
      type: "request_cancelled",
    });
    return payloads;
  }

  push({
    userId: request.consumerId,
    title: "درخواست لغو شد",
    body: `درخواست ${serviceName} لغو شد`,
    type: "request_cancelled",
  });

  for (const link of requestProviders) {
    if (link.requestId !== request.id) continue;
    if (link.status !== "sent" && link.status !== "accepted") continue;
    push({
      userId: link.providerId,
      title: "درخواست لغو شد",
      body:
        cancelledBy === "consumer"
          ? `درخواست ${serviceName} توسط خدمات‌گیرنده لغو شد`
          : `درخواست ${serviceName} لغو شد`,
      type: "request_cancelled",
    });
  }

  return payloads;
}

export function buildSubscriptionExpiredNotification(
  providerId: string,
): NotificationPayload {
  return {
    userId: providerId,
    title: "اشتراک منقضی شد",
    body: "برای دریافت درخواست‌های جدید، اشتراک خود را تمدید کنید",
    type: "subscription_expired",
  };
}
