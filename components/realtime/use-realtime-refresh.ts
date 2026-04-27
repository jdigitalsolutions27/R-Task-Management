"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";

type RealtimeEvent = "*" | "INSERT" | "UPDATE" | "DELETE";

interface RealtimeRefreshConfig {
  event: RealtimeEvent;
  filter?: string;
  schema?: "public";
  table: keyof Database["public"]["Tables"];
}

export function useRealtimeRefresh({
  channelName,
  debounceMs = 250,
  enabled = true,
  subscriptions,
}: {
  channelName: string;
  debounceMs?: number;
  enabled?: boolean;
  subscriptions: readonly RealtimeRefreshConfig[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !subscriptions.length) {
      return;
    }

    const scheduleRefresh = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        router.refresh();
      }, debounceMs);
    };

    let channel = supabase.channel(channelName);

    for (const subscription of subscriptions) {
      channel = channel.on(
        "postgres_changes",
        {
          event: subscription.event,
          filter: subscription.filter,
          schema: subscription.schema ?? "public",
          table: subscription.table,
        },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      void supabase.removeChannel(channel);
    };
  }, [channelName, debounceMs, enabled, router, subscriptions, supabase]);
}
