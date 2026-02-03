// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentContracts } from "@/components/dashboard/recent-contracts";

export default async function DashboardPage() {
  const user = await requireUser();

  // Get contracts with stats
  const [contracts, totalContracts, contractsThisMonth, avgRiskScore] =
    await Promise.all([
      db.contract.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          fileName: true,
          status: true,
          riskScore: true,
          createdAt: true,
        },
      }),
      db.contract.count({
        where: { userId: user.id },
      }),
      db.contract.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(new Date().setDate(1)), // First day of current month
          },
        },
      }),
      db.contract.aggregate({
        where: {
          userId: user.id,
          riskScore: { not: null },
        },
        _avg: {
          riskScore: true,
        },
      }),
    ]);

  const remainingAnalyses = Math.max(
    0,
    user.monthlyLimit - user.contractsAnalyzed
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s an overview of your contract analyses.
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

      {/* Stats */}
      <StatsCards
        totalContracts={totalContracts}
        contractsThisMonth={contractsThisMonth}
        averageRiskScore={avgRiskScore._avg.riskScore}
        remainingAnalyses={remainingAnalyses}
      />

      {/* Recent Contracts */}
      <RecentContracts contracts={contracts} />
    </div>
  );
}
