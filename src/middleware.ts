import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/notes(.*)",
  "/meeting(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Debug check (visible in Vercel logs)
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CRITICAL: CLERK_SECRET_KEY is missing from environment variables!");
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
