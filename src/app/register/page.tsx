import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-4xl font-bold uppercase leading-none">
            Create an account
          </CardTitle>
          <CardDescription>
            Accounts are optional — checkout works without one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
