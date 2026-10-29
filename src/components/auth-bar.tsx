"use client";

import Link from "next/link";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Session-aware header controls. Deliberately a client component using
 * `useSession()` (fetched from /api/auth/session): under Cache Components the
 * observed Next.js build leaves root-layout-level Suspense holes unrevealed,
 * streaming a layout-level auth() read unreliably. Client-side session avoids
 * the layout hole entirely; servers re-verify in every admin action anyway.
 */
function AuthButtons() {
  const { status, data } = useSession();

  if (status === "loading") {
    return <div className="h-6 w-24 animate-pulse rounded bg-muted" aria-hidden />;
  }

  const isAdmin = data?.user?.role === "ADMIN";

  return (
    <>
      {isAdmin && (
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">Admin</Link>
        </Button>
      )}
      {data?.user && !isAdmin && (
        <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
          {data.user.email}
        </span>
      )}
      {data?.user ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      )}
    </>
  );
}

export function AuthBar() {
  return (
    <SessionProvider>
      <AuthButtons />
    </SessionProvider>
  );
}
