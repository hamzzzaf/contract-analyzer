import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Check if Clerk is configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

export default async function LandingPage() {
  let userId: string | null = null;

  // Only check auth if Clerk is configured
  if (isClerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    userId = authResult.userId;
  }

  // In dev mode without Clerk, show direct dashboard access
  const devMode = !isClerkConfigured;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Contract Analyzer
          </Link>
          <nav className="flex items-center gap-4">
            {userId || devMode ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
          Identify Risky Contract Clauses with AI
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Upload your contracts and let AI analyze them for potentially risky
          clauses. Get instant insights on liability, termination terms,
          auto-renewal, and more.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href={userId || devMode ? "/dashboard" : "/sign-up"}>
            <Button size="lg">
              {userId || devMode ? "Go to Dashboard" : "Start Free Trial"}
            </Button>
          </Link>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-gray-50 px-4 py-24">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    1
                  </span>
                  Upload Contract
                </CardTitle>
                <CardDescription>
                  Upload your PDF or DOCX contract files securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Supports contracts up to 10MB. Your files are encrypted and
                  automatically deleted after 30 days.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    2
                  </span>
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Claude AI extracts and categorizes all clauses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Identifies payment terms, liability, termination, IP rights,
                  confidentiality, and more.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    3
                  </span>
                  Risk Report
                </CardTitle>
                <CardDescription>
                  Get a detailed risk score and actionable insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Download a comprehensive PDF report with explanations and
                  recommendations for each flagged clause.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Risk Categories */}
      <section className="px-4 py-24">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">
            What We Analyze
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              "Liability Clauses",
              "Indemnification",
              "Termination Terms",
              "Auto-Renewal",
              "Payment Terms",
              "IP Rights",
              "Confidentiality",
              "Non-Compete",
              "Dispute Resolution",
              "Data Privacy",
              "Force Majeure",
              "And More...",
            ].map((category: string) => (
              <div
                key={category}
                className="rounded-lg border bg-white p-4 text-center text-sm font-medium"
              >
                {category}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary px-4 py-24 text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold">
            Ready to Protect Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Start analyzing contracts today. Free tier includes 3 contract
            analyses per month.
          </p>
          <Link href={userId || devMode ? "/dashboard" : "/sign-up"}>
            <Button size="lg" variant="secondary" className="mt-8">
              {userId || devMode ? "Go to Dashboard" : "Start Free Trial"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Contract Analyzer. All rights
            reserved.
          </p>
          <nav className="flex gap-6 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-900">
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
