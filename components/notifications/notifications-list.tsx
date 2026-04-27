"use client";

import { Bell, CheckCircle2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { dispatchNotificationRead } from "@/lib/utils/notification-events";
import { formatRelativeTime, titleCase } from "@/lib/utils/format";
import type { Notification } from "@/types/app";
import type { Database } from "@/types/database";

export function NotificationsList({
  initialNotifications,
  userId,
}: {
  initialNotifications: Notification[];
  userId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-list-${userId}`)
      .on<Database["public"]["Tables"]["notifications"]["Row"]>(
        "postgres_changes",
        {
          event: "INSERT",
          filter: `recipient_user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (!payload.new.read_at) {
            setNotifications((current) => [payload.new, ...current]);
          }
        },
      )
      .on<Database["public"]["Tables"]["notifications"]["Row"]>(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `recipient_user_id=eq.${userId}`,
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          if (payload.new.read_at) {
            setNotifications((current) =>
              current.filter((notification) => notification.id !== payload.new.id),
            );
            return;
          }

          setNotifications((current) =>
            current.map((notification) =>
              notification.id === payload.new.id ? payload.new : notification,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  async function markAsRead(id: string) {
    setError(null);
    setLoadingId(id);

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update notification.");
      }
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
      dispatchNotificationRead({ id });
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to update notification.");
    } finally {
      setLoadingId(null);
    }
  }

  if (!notifications.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#C9A646]/15 text-[#B8933A]">
            <Bell className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#111827]">No notifications yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            New approvals, reports, support updates, and workflow activity will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {notifications.map((notification) => {
        const unread = !notification.read_at;

        return (
          <Card
            className={cn(
              "transition-all duration-200 hover:-translate-y-0.5",
              unread ? "border-[#C9A646]/45 shadow-[0_18px_42px_rgba(201,166,70,0.12)]" : "",
            )}
            key={notification.id}
          >
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div
                  className={cn(
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                    unread ? "bg-[#C9A646] text-[#111827]" : "bg-[#F1EFEA] text-slate-500",
                  )}
                >
                  {unread ? <Bell className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                </div>
                <button
                  className="cursor-pointer text-left"
                  onClick={() => {
                    if (unread && loadingId !== notification.id) {
                      void markAsRead(notification.id);
                    }
                  }}
                  type="button"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#111827]">{notification.title}</h2>
                    {unread ? (
                      <span className="rounded-md bg-[#C9A646]/15 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8A6A16]">
                        New
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>{titleCase(notification.event_type)}</span>
                    <span aria-hidden="true">-</span>
                    <span>{formatRelativeTime(notification.created_at)}</span>
                  </div>
                </button>
              </div>

              {unread ? (
                <Button
                  disabled={loadingId === notification.id}
                  onClick={() => markAsRead(notification.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {loadingId === notification.id ? "Saving..." : "Mark as read"}
                </Button>
              ) : (
                <span className="rounded-md border border-[#E5E7EB] bg-[#F8F6F2] px-3 py-2 text-xs font-semibold text-slate-500">
                  Read
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
