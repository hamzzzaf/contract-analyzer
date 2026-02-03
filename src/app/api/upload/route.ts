import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveFile, generateFileKey, isAllowedContentType } from "@/services/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// POST /api/upload - Direct file upload (for local storage)
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!isAllowedContentType(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      );
    }

    // Generate file key
    const fileKey = generateFileKey(user.id, file.name);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    const fileUrl = await saveFile(fileKey, buffer, file.type);

    // Create contract record
    const contract = await db.contract.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileKey,
        fileUrl,
        fileSize: file.size,
        status: "PENDING",
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
