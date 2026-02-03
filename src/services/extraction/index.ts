import { extractPdfText, estimateTokenCount } from "./pdf-extractor";
import { extractDocxText } from "./docx-extractor";

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
  isScanned: boolean;
  warning: string | null;
  tokenEstimate: number;
}

export type FileType = "pdf" | "docx";

/**
 * Detect file type from content type or file name
 */
export function detectFileType(
  contentType?: string,
  fileName?: string
): FileType | null {
  // Check content type first
  if (contentType) {
    if (contentType === "application/pdf") {
      return "pdf";
    }
    if (
      contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "docx";
    }
  }

  // Fall back to file extension
  if (fileName) {
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext === "pdf") return "pdf";
    if (ext === "docx") return "docx";
  }

  return null;
}

/**
 * Extract text from a document buffer
 */
export async function extractText(
  buffer: Buffer,
  fileType: FileType
): Promise<ExtractionResult> {
  let result;

  if (fileType === "pdf") {
    result = await extractPdfText(buffer);
  } else if (fileType === "docx") {
    result = await extractDocxText(buffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  return {
    ...result,
    tokenEstimate: estimateTokenCount(result.text),
  };
}

// Re-export for convenience
export { extractPdfText, extractDocxText, estimateTokenCount };
