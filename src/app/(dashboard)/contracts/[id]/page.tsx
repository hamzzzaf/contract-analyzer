// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalysisActions } from "@/components/contracts/analysis-actions";
function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">Pending Analysis</Badge>;
    case "PROCESSING":
      return <Badge variant="secondary">Analyzing...</Badge>;
    case "COMPLETED":
      return <Badge variant="default">Analysis Complete</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Analysis Failed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function getRiskBadge(level: string) {
  switch (level) {
    case "LOW":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          Low Risk
        </Badge>
      );
    case "MEDIUM":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          Medium Risk
        </Badge>
      );
    case "HIGH":
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700">
          High Risk
        </Badge>
      );
    case "CRITICAL":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          Critical
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  PAYMENT_TERMS: "Payment Terms",
  LIABILITY: "Liability",
  INDEMNIFICATION: "Indemnification",
  TERMINATION: "Termination",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  CONFIDENTIALITY: "Confidentiality",
  NON_COMPETE: "Non-Compete",
  AUTO_RENEWAL: "Auto-Renewal",
  DISPUTE_RESOLUTION: "Dispute Resolution",
  DATA_PRIVACY: "Data Privacy",
  FORCE_MAJEURE: "Force Majeure",
  OTHER: "Other",
};

function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const contract = await db.contract.findUnique({
    where: {
      id,
      userId: user.id,
    },
    include: {
      analysis: {
        include: {
          clauses: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!contract) {
    notFound();
  }

  const analysis = contract.analysis;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/contracts">
              <Button variant="ghost" size="sm">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Contracts
              </Button>
            </Link>
          </div>
          <h1 className="mt-4 text-3xl font-bold">{contract.fileName}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span>{formatFileSize(contract.fileSize)}</span>
            {contract.pageCount && <span>{contract.pageCount} pages</span>}
            <span>
              Uploaded {new Date(contract.createdAt).toLocaleDateString()}
            </span>
            {getStatusBadge(contract.status)}
          </div>
        </div>
        <div className="flex gap-2">
          <AnalysisActions
            contractId={contract.id}
            initialStatus={contract.status}
          />
          {analysis && (
            <Button variant="outline">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Report
            </Button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {contract.status === "PENDING" && (
        <Card>
          <CardContent className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-4 font-medium">Ready for Analysis</p>
            <p className="mt-2 text-sm text-gray-500">
              Click &quot;Start Analysis&quot; to begin AI-powered contract
              review
            </p>
          </CardContent>
        </Card>
      )}

      {contract.status === "PROCESSING" && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 font-medium">Analyzing Contract...</p>
            <p className="mt-2 text-sm text-gray-500">
              This usually takes 30-60 seconds depending on contract length
            </p>
          </CardContent>
        </Card>
      )}

      {contract.status === "FAILED" && (
        <Card className="border-red-200">
          <CardContent className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-4 font-medium text-red-600">Analysis Failed</p>
            <p className="mt-2 text-sm text-gray-500">
              There was an error analyzing this contract. Use the &quot;Retry
              Analysis&quot; button above to try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Risk Score Card */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">
                    {analysis.riskScore.toFixed(1)}
                  </span>
                  <span className="text-gray-500">/ 10</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {analysis.riskSummary}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Clauses Analyzed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {analysis.clauses.length}
                </div>
                <p className="mt-2 text-sm text-gray-500">Total clauses found</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  High Risk Clauses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-red-600">
                  {
                    analysis.clauses.filter(
                      (c) =>
                        c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL"
                    ).length
                  }
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Clauses */}
          <Card>
            <CardHeader>
              <CardTitle>Analyzed Clauses</CardTitle>
              <CardDescription>
                All significant clauses identified in the contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.clauses.map((clause) => (
                <div
                  key={clause.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getCategoryLabel(clause.category )}
                      </Badge>
                      {getRiskBadge(clause.riskLevel )}
                    </div>
                    {clause.pageNumber && (
                      <span className="text-sm text-gray-500">
                        Page {clause.pageNumber}
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-3 border-l-4 border-gray-200 pl-4 italic text-gray-600">
                    &quot;{clause.text}&quot;
                  </blockquote>
                  <p className="mt-3 text-sm text-gray-700">
                    {clause.explanation}
                  </p>
                  {clause.recommendation && (
                    <div className="mt-3 rounded bg-blue-50 p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Recommendation:
                      </p>
                      <p className="text-sm text-blue-700">
                        {clause.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
