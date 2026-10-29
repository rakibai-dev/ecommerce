import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function Page(props: PageProps<"/login">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16">
      {/* Both the session read and the ?error/?registered notices are
          request-time data, so all of it streams inside this boundary. */}
      <Suspense fallback={<Card><CardContent className="h-64" /></Card>}>
        <LoginBox searchParams={props.searchParams} />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

async function LoginBox({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  // auth() internals use Web Crypto; request-time render keeps it legal.
  await connection();
  const session = await auth();
  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const registered = params.registered === "1";
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return (
    <Card className="border-none shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-4xl font-bold uppercase leading-none">
          Sign in
        </CardTitle>
        <CardDescription>
          Accounts are optional — checkout also works as a guest.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {registered && (
          <p
            role="status"
            className="rounded-xl bg-card p-3 text-sm text-stock"
          >
            Account created. Sign in to continue.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-card p-3 text-sm text-destructive"
          >
            {error === "CredentialsSignin"
              ? "Wrong email or password."
              : `Sign-in failed: ${error}`}
          </p>
        )}
        <LoginForm callbackUrl={callbackUrl} />
      </CardContent>
    </Card>
  );
}
