/**
 * Setup verification script
 * Run with: npx tsx scripts/check-setup.ts
 */

import "dotenv/config";

interface CheckResult {
  name: string;
  status: "ok" | "missing" | "error";
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, envVar: string, isPublic = false): void {
  const value = process.env[envVar];

  if (!value || value === "" || value.includes("placeholder")) {
    results.push({
      name,
      status: "missing",
      message: `${envVar} is not set`,
    });
  } else {
    const masked = isPublic
      ? value.substring(0, 10) + "..."
      : value.substring(0, 5) + "***";
    results.push({
      name,
      status: "ok",
      message: `${envVar} = ${masked}`,
    });
  }
}

console.log("\n🔍 Checking Contract Analyzer Setup...\n");
console.log("=".repeat(50));

// Database
console.log("\n📦 DATABASE");
check("PostgreSQL", "DATABASE_URL");

// Clerk Auth
console.log("\n🔐 AUTHENTICATION (Clerk)");
check("Clerk Publishable Key", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", true);
check("Clerk Secret Key", "CLERK_SECRET_KEY");

// Anthropic
console.log("\n🤖 AI (Anthropic)");
check("Anthropic API Key", "ANTHROPIC_API_KEY");

// AWS S3
console.log("\n☁️  FILE STORAGE (AWS S3)");
check("AWS Access Key ID", "AWS_ACCESS_KEY_ID");
check("AWS Secret Access Key", "AWS_SECRET_ACCESS_KEY");
check("AWS Region", "AWS_REGION");
check("AWS S3 Bucket", "AWS_S3_BUCKET");

// Stripe (optional for MVP)
console.log("\n💳 PAYMENTS (Stripe) - Optional");
check("Stripe Secret Key", "STRIPE_SECRET_KEY");

// Print results
console.log("\n" + "=".repeat(50));
console.log("\n📊 SUMMARY\n");

const missing = results.filter(r => r.status === "missing");
const configured = results.filter(r => r.status === "ok");

if (configured.length > 0) {
  console.log(`✅ Configured (${configured.length}):`);
  configured.forEach(r => console.log(`   - ${r.name}`));
}

if (missing.length > 0) {
  console.log(`\n❌ Missing (${missing.length}):`);
  missing.forEach(r => console.log(`   - ${r.name}: ${r.message}`));
}

// Minimum requirements check
console.log("\n" + "=".repeat(50));
console.log("\n🚀 READY TO RUN?\n");

const requiredForBasic = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

const requiredForAnalysis = [
  ...requiredForBasic,
  "ANTHROPIC_API_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET",
];

const hasBasic = requiredForBasic.every(
  env => process.env[env] && !process.env[env]?.includes("placeholder")
);

const hasAnalysis = requiredForAnalysis.every(
  env => process.env[env] && !process.env[env]?.includes("placeholder")
);

if (hasAnalysis) {
  console.log("✅ Full functionality ready! You can upload and analyze contracts.");
} else if (hasBasic) {
  console.log("⚠️  Basic auth works, but you need these for full functionality:");
  if (!process.env.ANTHROPIC_API_KEY) console.log("   - ANTHROPIC_API_KEY (for AI analysis)");
  if (!process.env.AWS_ACCESS_KEY_ID) console.log("   - AWS credentials (for file uploads)");
} else {
  console.log("❌ Missing required configuration. See setup guide below.");
}

console.log("\n" + "=".repeat(50));
console.log("\n📚 SETUP GUIDES\n");
console.log("1. Railway (Database): https://railway.app");
console.log("   - Create project → Add PostgreSQL → Copy DATABASE_URL");
console.log("");
console.log("2. Clerk (Auth): https://dashboard.clerk.com");
console.log("   - Create application → Copy API keys from 'API Keys' section");
console.log("");
console.log("3. Anthropic (AI): https://console.anthropic.com");
console.log("   - Go to API Keys → Create key");
console.log("");
console.log("4. AWS S3 (Storage): https://aws.amazon.com/s3");
console.log("   - Create bucket → Create IAM user with S3 access → Get credentials");
console.log("");
