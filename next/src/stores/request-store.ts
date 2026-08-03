"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/mock/constants";
import { SEED_USER_IDS } from "@/lib/mock/users";
import {
  applyAccept,
  applyCancel,
  applyComplete,
  applyReject,
  applySendToProvider,
  createSearchRequest,
  validateAccept,
  validateCancel,
  validateComplete,
  validateReject,
  validateSendToProvider,
  type RequestEngineError,
} from "@/lib/request-engine";
import {
  buildRequestAcceptedNotification,
  buildRequestCancelledNotifications,
  buildRequestCompletedNotification,
  buildRequestRejectedNotification,
  buildRequestSentNotification,
} from "@/lib/notifications/request-events";
import type {
  CancelledBy,
  Request,
  RequestProvider,
} from "@/types";
import { useNotificationStore } from "@/stores/notification-store";

interface RequestState {
  requests: Request[];
  requestProviders: RequestProvider[];
  seedDemoRequest: () => void;
  createFromSearch: (input: {
    consumerId: string;
    landId: string;
    serviceId: string;
    scheduledDates: string[];
    providerIds: string[];
  }) => Request;
  sendToProvider: (requestId: string, providerId: string) => RequestEngineError | null;
  acceptRequest: (
    requestId: string,
    providerId: string,
    price: number,
  ) => RequestEngineError | null;
  rejectRequest: (
    requestId: string,
    providerId: string,
  ) => RequestEngineError | null;
  cancelRequest: (
    requestId: string,
    cancelledBy: CancelledBy,
    cancelReason?: string,
  ) => RequestEngineError | null;
  completeRequest: (
    requestId: string,
    consumerId: string,
  ) => RequestEngineError | null;
  getRequestById: (requestId: string) => Request | undefined;
}

const DEMO_REQUEST_ID = "req-seed-demo";

function dispatchNotification(payload: {
  userId: string;
  title: string;
  body: string;
  type: Parameters<
    ReturnType<typeof useNotificationStore.getState>["addNotification"]
  >[0]["type"];
}) {
  useNotificationStore.getState().addNotification(payload);
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      requests: [],
      requestProviders: [],

      seedDemoRequest: () => {
        if (get().requests.some((request) => request.id === DEMO_REQUEST_ID)) {
          return;
        }

        const now = new Date().toISOString();
        const demoRequest: Request = {
          id: DEMO_REQUEST_ID,
          consumerId: SEED_USER_IDS.zahra,
          landId: "land-wheat-north",
          serviceId: "svc-plant-wheat",
          scheduledDates: ["2025-07-15T00:00:00.000Z"],
          status: "pending_provider",
          price: 0,
          createdAt: now,
          updatedAt: now,
        };

        set({
          requests: [...get().requests, demoRequest],
          requestProviders: [
            ...get().requestProviders,
            {
              requestId: DEMO_REQUEST_ID,
              providerId: SEED_USER_IDS.ali,
              status: "sent",
              sentAt: now,
            },
          ],
        });
      },

      createFromSearch: (input) => {
        const request = createSearchRequest({
          consumerId: input.consumerId,
          landId: input.landId,
          serviceId: input.serviceId,
          scheduledDates: input.scheduledDates,
        });

        const now = new Date().toISOString();
        const requestProviders: RequestProvider[] = input.providerIds.map(
          (providerId) => ({
            requestId: request.id,
            providerId,
            status: "sent",
            sentAt: now,
          }),
        );

        set({
          requests: [...get().requests, request],
          requestProviders: [...get().requestProviders, ...requestProviders],
        });

        return request;
      },

      sendToProvider: (requestId, providerId) => {
        const request = get().requests.find((item) => item.id === requestId);
        if (!request) {
          return { code: "NOT_FOUND", message: "درخواست یافت نشد" };
        }

        const validation = validateSendToProvider(
          request,
          providerId,
          get().requestProviders,
        );
        if (!validation.ok) return validation.error;

        const link = applySendToProvider(requestId, providerId);
        set({
          requestProviders: [...get().requestProviders, link],
        });

        dispatchNotification(buildRequestSentNotification(providerId, request));
        return null;
      },

      acceptRequest: (requestId, providerId, price) => {
        const request = get().requests.find((item) => item.id === requestId);
        if (!request) {
          return { code: "NOT_FOUND", message: "درخواست یافت نشد" };
        }

        const validation = validateAccept(
          request,
          providerId,
          get().requestProviders,
        );
        if (!validation.ok) return validation.error;

        const result = applyAccept(
          request,
          get().requestProviders,
          providerId,
          price,
        );

        set({
          requests: get().requests.map((item) =>
            item.id === requestId ? result.request : item,
          ),
          requestProviders: result.requestProviders,
        });

        dispatchNotification(
          buildRequestAcceptedNotification(
            request.consumerId,
            providerId,
            result.request,
          ),
        );
        return null;
      },

      rejectRequest: (requestId, providerId) => {
        const request = get().requests.find((item) => item.id === requestId);
        if (!request) {
          return { code: "NOT_FOUND", message: "درخواست یافت نشد" };
        }

        const validation = validateReject(
          request,
          providerId,
          get().requestProviders,
        );
        if (!validation.ok) return validation.error;

        set({
          requestProviders: applyReject(
            get().requestProviders,
            requestId,
            providerId,
          ),
        });

        dispatchNotification(
          buildRequestRejectedNotification(
            request.consumerId,
            providerId,
            request,
          ),
        );
        return null;
      },

      cancelRequest: (requestId, cancelledBy, cancelReason) => {
        const request = get().requests.find((item) => item.id === requestId);
        if (!request) {
          return { code: "NOT_FOUND", message: "درخواست یافت نشد" };
        }

        const validation = validateCancel(request, cancelledBy, cancelReason);
        if (!validation.ok) return validation.error;

        const result = applyCancel(
          request,
          get().requestProviders,
          cancelledBy,
          cancelReason,
        );

        set({
          requests: get().requests.map((item) =>
            item.id === requestId ? result.request : item,
          ),
          requestProviders: result.requestProviders,
        });

        for (const payload of buildRequestCancelledNotifications(
          result.request,
          result.requestProviders,
          cancelledBy,
        )) {
          dispatchNotification(payload);
        }

        return null;
      },

      completeRequest: (requestId, consumerId) => {
        const request = get().requests.find((item) => item.id === requestId);
        if (!request) {
          return { code: "NOT_FOUND", message: "درخواست یافت نشد" };
        }

        const validation = validateComplete(request, consumerId);
        if (!validation.ok) return validation.error;

        const completed = applyComplete(request);
        set({
          requests: get().requests.map((item) =>
            item.id === requestId ? completed : item,
          ),
        });

        if (completed.assignedProviderId) {
          dispatchNotification(
            buildRequestCompletedNotification(
              completed.assignedProviderId,
              completed,
            ),
          );
        }

        return null;
      },

      getRequestById: (requestId) => {
        return get().requests.find((request) => request.id === requestId);
      },
    }),
    {
      name: STORAGE_KEYS.requests,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
