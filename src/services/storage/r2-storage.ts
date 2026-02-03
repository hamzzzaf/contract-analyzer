/**
 * Cloudflare R2 Storage Service
 * R2 is S3-compatible, so we use the AWS SDK
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize R2 client (only when credentials are available)
function getR2Client(): S3Client {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME not configured");
  }
  return bucket;
}

/**
 * Upload a file to R2
 */
export async function uploadFile(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  await client.send(command);
}

/**
 * Get file contents as a Buffer
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error("Empty response body from R2");
  }

  // Convert readable stream to buffer
  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

/**
 * Generate a unique file key for storage
 */
export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  return `contracts/${userId}/${timestamp}-${randomStr}-${sanitizedName}`;
}

/**
 * Validate that a content type is allowed
 */
export function isAllowedContentType(contentType: string): boolean {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  return allowedTypes.includes(contentType);
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_ENDPOINT &&
    process.env.R2_BUCKET_NAME
  );
}
