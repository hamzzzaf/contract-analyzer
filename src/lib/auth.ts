import { db } from "./db";

// Check if Clerk is configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder") &&
  !process.env.CLERK_SECRET_KEY.includes("placeholder");

// Dev user ID for local development
const DEV_USER_ID = "dev-user";
const DEV_USER_EMAIL = "dev@localhost";

// Guest user for anonymous access
const GUEST_USER_ID = "guest-user";
const GUEST_USER_EMAIL = "guest@example.com";

/**
 * Get or create the dev user for local development
 */
async function getOrCreateDevUser() {
  let user = await db.user.findUnique({
    where: { clerkId: DEV_USER_ID },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: DEV_USER_ID,
        email: DEV_USER_EMAIL,
        monthlyLimit: 100, // High limit for dev
      },
    });
  }

  return user;
}

/**
 * Get or create a guest user for anonymous access
 */
async function getOrCreateGuestUser() {
  let user = await db.user.findUnique({
    where: { clerkId: GUEST_USER_ID },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkId: GUEST_USER_ID,
        email: GUEST_USER_EMAIL,
        monthlyLimit: 3, // Limited for guests
      },
    });
  }

  return user;
}

export async function getCurrentUser() {
  // In dev mode without Clerk, use dev user
  if (!isClerkConfigured) {
    return getOrCreateDevUser();
  }

  // With Clerk configured, use real auth
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  // If no authenticated user, use guest user (allows trying the app)
  if (!user) {
    return getOrCreateGuestUser();
  }

  return user;
}

export async function syncUser() {
  // In dev mode, just return the dev user
  if (!isClerkConfigured) {
    return getOrCreateDevUser();
  }

  // With Clerk configured, sync real user
  const { currentUser } = await import("@clerk/nextjs/server");
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User has no email address");
  }

  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
    },
    create: {
      clerkId: clerkUser.id,
      email,
    },
  });

  return user;
}

export async function checkUsageLimit() {
  const user = await requireUser();

  if (user.contractsAnalyzed >= user.monthlyLimit) {
    return {
      allowed: false,
      remaining: 0,
      limit: user.monthlyLimit,
    };
  }

  return {
    allowed: true,
    remaining: user.monthlyLimit - user.contractsAnalyzed,
    limit: user.monthlyLimit,
  };
}

export async function incrementUsage() {
  const user = await requireUser();

  await db.user.update({
    where: { id: user.id },
    data: {
      contractsAnalyzed: { increment: 1 },
    },
  });
}

// Export for debugging
export const authMode = isClerkConfigured ? "clerk" : "dev";
