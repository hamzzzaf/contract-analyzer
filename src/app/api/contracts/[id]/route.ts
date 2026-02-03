import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/services/storage";

// GET /api/contracts/[id] - Get a single contract with analysis
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

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
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete a contract
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

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

    // Delete file from storage
    try {
      await deleteFile(contract.fileKey);
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database (cascades to analysis and clauses)
    await db.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { error: "Failed to delete contract" },
      { status: 500 }
    );
  }
}
