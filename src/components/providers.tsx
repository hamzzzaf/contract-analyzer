"use client";

import { ClerkProvider } from "@clerk/nextjs";

// Check if Clerk is configured (client-side check)
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

export function Providers({ children }: { children: React.ReactNode }) {
  // In dev mode without Clerk, render children directly
  if (!isClerkConfigured) {
    return <>{children}</>;
  }

  // With Clerk configured, wrap with ClerkProvider
  return <ClerkProvider>{children}</ClerkProvider>;
}
