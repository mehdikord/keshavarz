import { extractDeepLinkFromData } from "@/server/modules/notifications/notification.deeplink";

export function mapNotification(item: {
  body: string;
  createdAt: Date;
  data: unknown;
  publicId: string;
  readAt: Date | null;
  relatedRequestPublicId?: string | null;
  title: string;
  type: string;
}) {
  const data =
    item.data && typeof item.data === "object" && !Array.isArray(item.data)
      ? (item.data as Record<string, unknown>)
      : null;

  return {
    body: item.body,
    createdAt: item.createdAt.toISOString(),
    deepLink: extractDeepLinkFromData(item.data),
    notificationId: item.publicId,
    readAt: item.readAt?.toISOString() ?? null,
    relatedRequestId:
      item.relatedRequestPublicId ??
      (typeof data?.requestId === "string" ? data.requestId : null),
    title: item.title,
    type: item.type,
  };
}

export function mapAdminNotification(item: {
  adminPublicId: string | null;
  body: string;
  createdAt: Date;
  data: unknown;
  deliveries: Array<{
    attemptsCount: number;
    channel: string;
    errorMessage: string | null;
    status: string;
  }>;
  publicId: string;
  readAt: Date | null;
  recipientType: string;
  title: string;
  type: string;
  userPublicId: string | null;
}) {
  return {
    ...mapNotification(item),
    deliveries: item.deliveries.map((delivery) => ({
      attemptsCount: delivery.attemptsCount,
      channel: delivery.channel,
      errorMessage: delivery.errorMessage,
      status: delivery.status,
    })),
    recipient: {
      adminId: item.adminPublicId,
      type: item.recipientType,
      userId: item.userPublicId,
    },
  };
}
