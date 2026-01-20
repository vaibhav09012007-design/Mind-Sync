import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingPage } from "./LandingPage";

export default async function RootPage() {
  const { userId } = await auth();

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  // Show landing page for unauthenticated users
  return <LandingPage />;
}
