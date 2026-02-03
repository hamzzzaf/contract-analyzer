import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Contract {
  id: string;
  fileName: string;
  status: string;
  riskScore: number | null;
  createdAt: Date;
}

interface RecentContractsProps {
  contracts: Contract[];
}

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
        Low Risk ({score.toFixed(1)})
      </Badge>
    );
  }
  if (score <= 6) {
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
        Medium Risk ({score.toFixed(1)})
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-red-50 text-red-700">
      High Risk ({score.toFixed(1)})
    </Badge>
  );
}

export function RecentContracts({ contracts }: RecentContractsProps) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
          <CardDescription>
            Your recently analyzed contracts will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="h-12 w-12 text-gray-400"
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
            <p className="mt-2 text-sm text-gray-600">No contracts yet</p>
            <Link
              href="/contracts/upload"
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Upload your first contract
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Contracts</CardTitle>
        <CardDescription>
          Your recently analyzed contracts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/contracts/${contract.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <svg
                  className="h-8 w-8 text-gray-400"
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
                <div>
                  <p className="font-medium">{contract.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(contract.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRiskBadge(contract.riskScore)}
                {getStatusBadge(contract.status)}
              </div>
            </Link>
          ))}
        </div>
        {contracts.length >= 5 && (
          <div className="mt-4 text-center">
            <Link
              href="/contracts"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all contracts
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
