"use client";

export const notificationEvents = {
  read: "rtask:notification-read",
} as const;

export function dispatchNotificationRead(detail: { id: string }) {
  window.dispatchEvent(
    new CustomEvent(notificationEvents.read, {
      detail,
    }),
  );
}
