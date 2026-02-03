import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyzeContract } from "@/services/analysis";

// POST /api/contracts/[id]/analyze - Start contract analysis
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Check if contract exists and belongs to user
    const contract = await db.contract.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Check if already processing
    if (contract.status === "PROCESSING") {
      return NextResponse.json(
        { error: "Contract is already being analyzed" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (user.contractsAnalyzed >= user.monthlyLimit) {
      return NextResponse.json(
        {
          error: "Monthly analysis limit reached. Please upgrade your plan.",
          code: "LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Increment usage counter
    await db.user.update({
      where: { id: user.id },
      data: { contractsAnalyzed: { increment: 1 } },
    });

    // Start analysis in background
    // Note: In production, you'd want to use a job queue (like BullMQ, Inngest, etc.)
    // For now, we'll run it async without waiting
    analyzeContract({ contractId: id }).catch((error) => {
      console.error("Background analysis failed:", error);
    });

    return NextResponse.json({
      status: "processing",
      message: "Analysis started. Poll the contract endpoint for status.",
      contractId: id,
    });
  } catch (error) {
    console.error("Error starting analysis:", error);

    // Check for specific errors
    if (error instanceof Error && error.message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        {
          error: "AI service not configured. Please add your Anthropic API key.",
          code: "API_KEY_MISSING",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start analysis" },
      { status: 500 }
    );
  }
}
