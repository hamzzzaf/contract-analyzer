import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if Clerk is configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") &&
  !process.env.CLERK_SECRET_KEY.includes("placeholder");

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/contracts(.*)",
  "/settings(.*)",
  "/billing(.*)",
]);

// Public routes that don't need auth
const _isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default async function middleware(req: NextRequest) {
  // Add security headers to all responses
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  };

  // If Clerk is not configured, allow all requests (dev mode)
  if (!isClerkConfigured) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Use Clerk middleware for authentication
  return clerkMiddleware(async (auth, req) => {
    const { userId } = await auth();

    // If user is not signed in and trying to access protected route
    if (!userId && isProtectedRoute(req)) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // If user is signed in and trying to access sign-in/sign-up pages
    if (userId && (req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up"))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return addSecurityHeaders(NextResponse.next());
  })(req);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
