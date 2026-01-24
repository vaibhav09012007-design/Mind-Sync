"use client";

import { SignIn, useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function SignInContent() {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || searchParams.get("redirect_to");

  useEffect(() => {
    // Loop Detection Logic:
    // If the user is ALREADY signed in on the client side,
    // BUT they have been redirected back to the sign-in page (indicated by redirect_url),
    // it means the Server rejected their session (Key Mismatch or Stale Cookie).
    //
    // Solution: Force sign-out to clear the bad session/cookies.
    if (isSignedIn && redirectUrl) {
      console.warn("Redirect loop detected. Clearing invalid session...");
      signOut();
    }
  }, [isSignedIn, redirectUrl, signOut]);

  return <SignIn routing="path" path="/sign-in" />;
}

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<div />}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
