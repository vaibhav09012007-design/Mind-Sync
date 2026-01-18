import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/kanban(.*)",
  "/focus(.*)",
  "/analytics(.*)",
  "/notes(.*)",
  "/meeting(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Debug check (visible in Vercel logs)
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CRITICAL: CLERK_SECRET_KEY is missing from environment variables!");
  }

  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }

  // Protect dashboard and app routes
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
