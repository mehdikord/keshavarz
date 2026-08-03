import { SEED_USERS } from "@/lib/mock/users";
import type { Request, RequestStatus } from "@/types";

export type ViewerRole = "consumer" | "provider";

export function canShowPhone(status: RequestStatus): boolean {
  return status === "in_progress" || status === "completed";
}

function getPhoneForUser(userId: string): string | undefined {
  return SEED_USERS.find((user) => user.id === userId)?.phone;
}

export interface ContactInfo {
  phone: string | null;
  maskedMessage: string;
}

export function getContactInfo(
  request: Request,
  viewerRole: ViewerRole,
): ContactInfo {
  const maskedMessage = "پس از قبول درخواست، شماره تماس نمایش داده می‌شود";

  if (!canShowPhone(request.status)) {
    return { phone: null, maskedMessage };
  }

  const targetUserId =
    viewerRole === "consumer"
      ? request.assignedProviderId
      : request.consumerId;

  if (!targetUserId) {
    return { phone: null, maskedMessage };
  }

  return {
    phone: getPhoneForUser(targetUserId) ?? null,
    maskedMessage,
  };
}
