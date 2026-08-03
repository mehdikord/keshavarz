"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/mock/constants";
import type { Notification, NotificationType } from "@/types";

interface AddNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (input: AddNotificationInput) => void;
  markRead: (notificationId: string) => void;
  markAllRead: (userId: string) => void;
  clearAll: () => void;
  getForUser: (userId: string) => Notification[];
}

function countUnread(notifications: Notification[]): number {
  return notifications.filter((notification) => !notification.read).length;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (input) => {
        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: input.userId,
          title: input.title,
          body: input.body,
          type: input.type,
          read: false,
          createdAt: new Date().toISOString(),
        };

        const notifications = [notification, ...get().notifications];
        set({
          notifications,
          unreadCount: countUnread(notifications),
        });
      },

      markRead: (notificationId) => {
        const notifications = get().notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        );

        set({
          notifications,
          unreadCount: countUnread(notifications),
        });
      },

      markAllRead: (userId) => {
        const notifications = get().notifications.map((notification) =>
          notification.userId === userId
            ? { ...notification, read: true }
            : notification,
        );

        set({
          notifications,
          unreadCount: countUnread(notifications),
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      getForUser: (userId) => {
        return get().notifications.filter(
          (notification) => notification.userId === userId,
        );
      },
    }),
    {
      name: STORAGE_KEYS.notifications,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
