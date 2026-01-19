import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function RootPage() {
  const { userId } = await auth();

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="max-w-xl mx-4 space-y-8 text-center p-8">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <span className="text-3xl font-bold">M</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Mind-Sync
          </h1>
          <p className="text-xl text-muted-foreground">
            Your AI-powered productivity companion. <br />
            <span className="text-sm mt-2 block">
              Bridge the gap between planning and execution.
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-in">
            <Button size="lg" variant="default">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="lg" variant="outline">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
