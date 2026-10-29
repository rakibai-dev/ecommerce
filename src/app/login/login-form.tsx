"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Fires Auth.js' credential sign-in. On failure Auth.js redirects back with
 * ?error=CredentialsSignin — the wrapping page (inside Suspense) renders
 * that notice. On success it lands on `callbackUrl` if given.
 */
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        signIn("credentials", {
          email,
          password,
          redirect: true,
          redirectTo: callbackUrl || "/",
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Button asChild variant="link" size="sm" className="px-0">
        <Link href="/register">Need an account? Register</Link>
      </Button>

      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
        Admin demo account: <span className="font-mono">admin@shop.local</span> /{" "}
        <span className="font-mono">admin1234</span>
      </p>
    </form>
  );
}
