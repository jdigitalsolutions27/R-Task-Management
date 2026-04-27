"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { notificationEvents } from "@/lib/utils/notification-events";
import type { Database } from "@/types/database";

export function NotificationBellLink({
  initialCount,
  userId,
}: {
  initialCount: number;
  userId: string;
}) {
  const [count, setCount] = useState(initialCount);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    const channel = supabase
      .channel(`notification-bell-${userId}`)
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
            setCount((current) => current + 1);
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
          const wasUnread = !payload.old.read_at;
          const isUnread = !payload.new.read_at;

          if (wasUnread && !isUnread) {
            setCount((current) => Math.max(0, current - 1));
          }

          if (!wasUnread && isUnread) {
            setCount((current) => current + 1);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  useEffect(() => {
    function handleRead() {
      setCount((current) => Math.max(0, current - 1));
    }

    window.addEventListener(notificationEvents.read, handleRead);

    return () => {
      window.removeEventListener(notificationEvents.read, handleRead);
    };
  }, []);

  return (
    <Link
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
      className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_24px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/14"
      href="/notifications"
    >
      <Bell className="h-5 w-5 text-slate-100 transition-colors group-hover:text-white" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0F172A] bg-[#E11D48] px-1 text-[10px] font-bold leading-none text-white shadow-[0_8px_16px_rgba(225,29,72,0.35)]">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
