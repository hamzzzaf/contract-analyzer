import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDownloadUrl } from "@/services/storage";

// GET /api/contracts - List all contracts for the current user
export async function GET() {
  try {
    const user = await requireUser();

    const contracts = await db.contract.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        pageCount: true,
        status: true,
        riskScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create a new contract record after S3 upload
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const { fileName, fileKey, fileSize } = body;

    if (!fileName || !fileKey || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate download URL
    const fileUrl = await getDownloadUrl(fileKey);

    // Create contract record
    const contract = await db.contract.create({
      data: {
        userId: user.id,
        fileName,
        fileKey,
        fileUrl,
        fileSize,
        status: "PENDING",
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { error: "Failed to create contract" },
      { status: 500 }
    );
  }
}
