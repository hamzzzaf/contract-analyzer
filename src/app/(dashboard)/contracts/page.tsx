// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import Link from "next/link";
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
function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary">Pending</Badge>;
    case "PROCESSING":
      return <Badge variant="secondary">Processing</Badge>;
    case "COMPLETED":
      return <Badge variant="default">Completed</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}

function getRiskBadge(score: number | null) {
  if (score === null) return null;

  if (score <= 3) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        Low ({score.toFixed(1)})
      </Badge>
    );
  }
  if (score <= 6) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
        Medium ({score.toFixed(1)})
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-red-50 text-red-700">
      High ({score.toFixed(1)})
    </Badge>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default async function ContractsPage() {
  const user = await requireUser();

  const contracts = await db.contract.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fileName: true,
      fileSize: true,
      status: true,
      riskScore: true,
      pageCount: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contracts</h1>
          <p className="text-gray-600">
            Manage and view all your uploaded contracts
          </p>
        </div>
        <Link href="/contracts/upload">
          <Button>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Upload Contract
          </Button>
        </Link>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Contracts Yet</CardTitle>
            <CardDescription>
              Upload your first contract to get started with AI-powered analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                className="h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-600">
                Get started by uploading a PDF or DOCX contract
              </p>
              <Link href="/contracts/upload" className="mt-4">
                <Button>Upload Your First Contract</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {contracts.map((contract: { id: string; fileName: string; fileSize: number; status: string; riskScore: number | null; pageCount: number | null; createdAt: Date }) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <svg
                        className="h-5 w-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">{contract.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(contract.fileSize)}
                        {contract.pageCount && ` · ${contract.pageCount} pages`}
                        {" · "}
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(contract.riskScore)}
                    {getStatusBadge(contract.status)}
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
