import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RootPage() {
  const { userId } = await auth();

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Show landing page for unauthenticated users
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold tracking-tight">Mind-Sync</h1>
        <p className="text-xl text-slate-300 max-w-md">
          Your AI-powered productivity companion. Manage tasks, schedule events, and stay focused.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}