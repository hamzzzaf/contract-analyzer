import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUploadPresignedUrl,
  generateFileKey,
  isAllowedContentType,
} from "@/services/storage/s3-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, contentType, fileSize } = body;

    // Validate required fields
    if (!fileName || !contentType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, contentType, fileSize" },
        { status: 400 }
      );
    }

    // Validate content type
    if (!isAllowedContentType(contentType)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PDF and DOCX files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        },
        { status: 400 }
      );
    }

    // Generate unique file key
    const key = generateFileKey(userId, fileName);

    // Generate presigned URL
    const uploadUrl = await getUploadPresignedUrl(key, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
