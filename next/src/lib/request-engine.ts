import type {
  CancelledBy,
  Request,
  RequestProvider,
  RequestStatus,
} from "@/types";

export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending_provider: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export interface RequestEngineError {
  code: string;
  message: string;
}

export type EngineResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: RequestEngineError };

function fail(code: string, message: string): EngineResult<never> {
  return { ok: false, error: { code, message } };
}

export function canTransition(
  from: RequestStatus,
  to: RequestStatus,
): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}

export function validateSendToProvider(
  request: Request,
  providerId: string,
  requestProviders: RequestProvider[],
): EngineResult<null> {
  if (request.status !== "pending_provider") {
    return fail("INVALID_STATUS", "این درخواست دیگر قابل ارسال نیست");
  }

  const exists = requestProviders.some(
    (item) =>
      item.requestId === request.id && item.providerId === providerId,
  );

  if (exists) {
    return fail("ALREADY_SENT", "درخواست قبلاً برای این خدمات‌دهنده ارسال شده");
  }

  return { ok: true, data: null };
}

export function applySendToProvider(
  requestId: string,
  providerId: string,
): RequestProvider {
  return {
    requestId,
    providerId,
    status: "sent",
    sentAt: new Date().toISOString(),
  };
}

export function validateAccept(
  request: Request,
  providerId: string,
  requestProviders: RequestProvider[],
): EngineResult<null> {
  if (request.status !== "pending_provider") {
    return fail("INVALID_STATUS", "فقط درخواست‌های در انتظار قابل قبول هستند");
  }

  const link = requestProviders.find(
    (item) =>
      item.requestId === request.id && item.providerId === providerId,
  );

  if (!link || link.status !== "sent") {
    return fail("NOT_ASSIGNED", "این درخواست برای شما ارسال نشده است");
  }

  if (request.assignedProviderId) {
    return fail("ALREADY_ASSIGNED", "این درخواست قبلاً به خدمات‌دهنده دیگری تخصیص یافته");
  }

  return { ok: true, data: null };
}

export function applyAccept(
  request: Request,
  requestProviders: RequestProvider[],
  providerId: string,
  price: number,
): { request: Request; requestProviders: RequestProvider[] } {
  const now = new Date().toISOString();

  return {
    request: {
      ...request,
      status: "in_progress",
      assignedProviderId: providerId,
      price,
      updatedAt: now,
    },
    requestProviders: requestProviders.map((item) => {
      if (item.requestId !== request.id) return item;
      if (item.providerId === providerId) {
        return { ...item, status: "accepted" as const };
      }
      return { ...item, status: "removed" as const };
    }),
  };
}

export function validateReject(
  request: Request,
  providerId: string,
  requestProviders: RequestProvider[],
): EngineResult<null> {
  if (request.status !== "pending_provider") {
    return fail("INVALID_STATUS", "فقط درخواست‌های در انتظار قابل رد هستند");
  }

  const link = requestProviders.find(
    (item) =>
      item.requestId === request.id && item.providerId === providerId,
  );

  if (!link || link.status !== "sent") {
    return fail("NOT_ASSIGNED", "این درخواست برای شما ارسال نشده است");
  }

  return { ok: true, data: null };
}

export function applyReject(
  requestProviders: RequestProvider[],
  requestId: string,
  providerId: string,
): RequestProvider[] {
  return requestProviders.map((item) =>
    item.requestId === requestId && item.providerId === providerId
      ? { ...item, status: "rejected" as const }
      : item,
  );
}

export function validateCancel(
  request: Request,
  cancelledBy: CancelledBy,
  cancelReason?: string,
): EngineResult<null> {
  if (request.status === "completed" || request.status === "cancelled") {
    return fail("INVALID_STATUS", "این درخواست قابل لغو نیست");
  }

  if (request.status === "in_progress") {
    if (!cancelReason || cancelReason.trim().length < 3) {
      return fail("REASON_REQUIRED", "دلیل لغو الزامی است");
    }
  }

  if (request.status === "pending_provider" && cancelledBy === "provider") {
    return fail("INVALID_ACTOR", "خدمات‌دهنده نمی‌تواند درخواست در انتظار را لغو کند");
  }

  return { ok: true, data: null };
}

export function applyCancel(
  request: Request,
  requestProviders: RequestProvider[],
  cancelledBy: CancelledBy,
  cancelReason?: string,
): { request: Request; requestProviders: RequestProvider[] } {
  const now = new Date().toISOString();

  return {
    request: {
      ...request,
      status: "cancelled",
      cancelledBy,
      cancelReason: cancelReason?.trim(),
      updatedAt: now,
    },
    requestProviders: requestProviders.map((item) =>
      item.requestId === request.id
        ? { ...item, status: "removed" as const }
        : item,
    ),
  };
}

export function validateComplete(
  request: Request,
  consumerId: string,
): EngineResult<null> {
  if (request.consumerId !== consumerId) {
    return fail("UNAUTHORIZED", "فقط صاحب درخواست می‌تواند کار را پایان دهد");
  }

  if (request.status !== "in_progress") {
    return fail("INVALID_STATUS", "فقط درخواست‌های در حال انجام قابل پایان هستند");
  }

  if (!canTransition(request.status, "completed")) {
    return fail("INVALID_TRANSITION", "انتقال وضعیت مجاز نیست");
  }

  return { ok: true, data: null };
}

export function applyComplete(request: Request): Request {
  const now = new Date().toISOString();
  return {
    ...request,
    status: "completed",
    updatedAt: now,
    completedAt: now,
  };
}

export function createSearchRequest(input: {
  consumerId: string;
  landId: string;
  serviceId: string;
  scheduledDates: string[];
}): Request {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    consumerId: input.consumerId,
    landId: input.landId,
    serviceId: input.serviceId,
    scheduledDates: input.scheduledDates,
    status: "pending_provider",
    price: 0,
    createdAt: now,
    updatedAt: now,
  };
}
