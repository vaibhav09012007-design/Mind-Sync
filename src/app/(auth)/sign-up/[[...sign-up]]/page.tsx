"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <SignUp
      appearance={{
        baseTheme: dark,
        elements: {
          rootBox: "mx-auto",
          card: "bg-slate-800/50 backdrop-blur border-slate-700",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-300",
          socialButtonsBlockButton: "bg-slate-700 border-slate-600 hover:bg-slate-600",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-slate-700 border-slate-600 text-white",
          footerActionLink: "text-purple-400 hover:text-purple-300",
        },
      }}
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      forceRedirectUrl="/dashboard"
    />
  );
}
