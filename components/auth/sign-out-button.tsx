"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function SignOutButton({
  redirectTo = "/login",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    setIsPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleSignOut} size="sm" variant="outline" disabled={isPending}>
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
