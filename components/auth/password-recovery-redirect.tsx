"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PasswordRecoveryRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/reset-password") {
      return;
    }

    const hasRecoveryMarker =
      new URLSearchParams(window.location.search).get("type") === "recovery" ||
      window.location.hash.includes("type=recovery");

    if (!hasRecoveryMarker) {
      return;
    }

    let cancelled = false;
    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        router.replace("/reset-password");
      }
    });

    async function redirectWhenSessionIsReady() {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) {
          return;
        }

        if (session) {
          router.replace("/reset-password");
          return;
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 200);
        });
      }
    }

    redirectWhenSessionIsReady();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return null;
}
