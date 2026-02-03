/**
 * Storage abstraction layer
 * Uses Cloudflare R2 in production, local storage in development
 */

import * as localStore from "./local-storage";
import * as r2Store from "./r2-storage";

// Check if R2 is configured
const useR2 = r2Store.isR2Configured();

export const storageMode = useR2 ? "r2" : "local";

console.log(`Storage mode: ${storageMode}`);

/**
 * Save a file to storage
 */
export async function saveFile(
  key: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  if (useR2 && contentType) {
    await r2Store.uploadFile(key, buffer, contentType);
    return await r2Store.getDownloadPresignedUrl(key);
  }

  // Fallback to local storage
  return localStore.saveFile(key, buffer);
}

/**
 * Get file contents as a Buffer
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  if (useR2) {
    try {
      return await r2Store.getFileBuffer(key);
    } catch (error) {
      console.warn("R2 fetch failed, trying local storage:", error);
    }
  }

  return localStore.getFileBuffer(key);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  if (useR2) {
    try {
      await r2Store.deleteFile(key);
      return;
    } catch (error) {
      console.warn("R2 delete failed, trying local storage:", error);
    }
  }

  return localStore.deleteFile(key);
}

/**
 * Generate a unique file key
 */
export function generateFileKey(userId: string, fileName: string): string {
  if (useR2) {
    return r2Store.generateFileKey(userId, fileName);
  }
  return localStore.generateFileKey(userId, fileName);
}

/**
 * Check if content type is allowed
 */
export function isAllowedContentType(contentType: string): boolean {
  return localStore.isAllowedContentType(contentType);
}

/**
 * Get a download URL for a file
 */
export async function getDownloadUrl(key: string): Promise<string> {
  if (useR2) {
    return r2Store.getDownloadPresignedUrl(key);
  }
  // For local storage, return the API route
  return `/api/files/${encodeURIComponent(key)}`;
}
