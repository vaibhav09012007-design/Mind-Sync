import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/calendar(.*)",
  "/notes(.*)",
  "/meeting(.*)",
  "/settings(.*)",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

// Common malicious bot patterns
const BLOCKED_BOT_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
];

export default clerkMiddleware(async (auth, req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  // Debug check (visible in Vercel logs)
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CRITICAL: CLERK_SECRET_KEY is missing from environment variables!");
  }

  // Bot detection for API routes
  if (isApiRoute(req)) {
    const userAgent = req.headers.get("user-agent") || "";
    if (BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(userAgent))) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  if (isProtectedRoute(req)) {
    // Prevent redirect loop if secret key is missing
    if (!process.env.CLERK_SECRET_KEY) {
      return new Response(
        "Configuration Error: CLERK_SECRET_KEY is missing from environment variables. Please add it to your Vercel project settings.",
        { status: 500, headers: { "Content-Type": "text/plain" } }
      );
    }
    await auth.protect();
  }

  // Add observability headers
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-response-time", `${Date.now() - startTime}ms`);
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
