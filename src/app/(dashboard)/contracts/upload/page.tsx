// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser, checkUsageLimit } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadForm } from "@/components/contracts/upload-form";

export default async function UploadPage() {
  await requireUser();
  const { allowed, remaining, limit } = await checkUsageLimit();

  if (!allowed) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Upload Contract</h1>
          <p className="text-gray-600">
            Upload a PDF or DOCX contract for analysis
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage Limit Reached</CardTitle>
            <CardDescription>
              You&apos;ve used all {limit} contract analyses for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Upgrade your plan to analyze more contracts or wait until next
              month when your limit resets.
            </p>
            <div className="flex gap-4">
              <Link href="/billing">
                <Button>Upgrade Plan</Button>
              </Link>
              <Link href="/contracts">
                <Button variant="outline">View Existing Contracts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Contract</h1>
          <p className="text-gray-600">
            Upload a PDF or DOCX contract for analysis
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {remaining} of {limit} analyses remaining this month
        </p>
      </div>

      <UploadForm />

      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Your contract will be securely uploaded and stored</li>
            <li>Our AI will extract the text from your document</li>
            <li>
              Each clause will be analyzed and categorized (liability,
              termination, etc.)
            </li>
            <li>
              You&apos;ll receive a risk score and detailed breakdown of any
              concerning clauses
            </li>
            <li>Download a PDF report with all findings and recommendations</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
