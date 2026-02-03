import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/analysis/[id] - Get analysis results for a contract
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: contractId } = await params;

    // Get contract with analysis
    const contract = await db.contract.findUnique({
      where: {
        id: contractId,
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
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Return status and analysis if available
    return NextResponse.json({
      contractId: contract.id,
      status: contract.status,
      riskScore: contract.riskScore,
      analysis: contract.analysis
        ? {
            id: contract.analysis.id,
            summary: contract.analysis.summary,
            riskScore: contract.analysis.riskScore,
            riskSummary: contract.analysis.riskSummary,
            clauseCount: contract.analysis.clauses.length,
            clauses: contract.analysis.clauses,
            createdAt: contract.analysis.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
