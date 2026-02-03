import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Local storage directory
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Generate a unique file key for storage
 */
export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${userId}/${timestamp}-${randomStr}-${sanitizedName}`;
}

/**
 * Save file to local storage
 */
export async function saveFile(key: string, buffer: Buffer): Promise<string> {
  await ensureUploadDir();

  const filePath = path.join(UPLOAD_DIR, key);
  const dirPath = path.dirname(filePath);

  // Ensure subdirectory exists
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }

  await writeFile(filePath, buffer);

  // Return a local URL that can be used to access the file
  return `/api/files/${encodeURIComponent(key)}`;
}

/**
 * Get file from local storage as Buffer
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const filePath = path.join(UPLOAD_DIR, key);

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${key}`);
  }

  return readFile(filePath);
}

/**
 * Delete file from local storage
 */
export async function deleteFile(key: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, key);

  if (existsSync(filePath)) {
    await unlink(filePath);
  }
}

/**
 * Check if file exists
 */
export function fileExists(key: string): boolean {
  const filePath = path.join(UPLOAD_DIR, key);
  return existsSync(filePath);
}

/**
 * Validate content type
 */
export function isAllowedContentType(contentType: string): boolean {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  return allowedTypes.includes(contentType);
}
