import mammoth from "mammoth";

export interface DocxExtractionResult {
  text: string;
  pageCount: number | null; // DOCX doesn't have true page counts
  isScanned: boolean;
  warning: string | null;
}

/**
 * Extract text from a DOCX buffer
 */
export async function extractDocxText(
  buffer: Buffer
): Promise<DocxExtractionResult> {
  try {
    // Extract raw text from DOCX
    const result = await mammoth.extractRawText({ buffer });

    const text = cleanText(result.value);

    // Check for warnings from mammoth
    const warnings = result.messages
      .filter((msg) => msg.type === "warning")
      .map((msg) => msg.message);

    // Estimate page count based on text length (roughly 3000 chars per page)
    const estimatedPageCount = Math.max(1, Math.ceil(text.length / 3000));

    // Check if the document has very little text (might be image-based)
    const isScanned = text.length < 100;

    let warning: string | null = null;

    if (isScanned) {
      warning =
        "This document contains very little text. It may be image-based or empty.";
    } else if (warnings.length > 0) {
      warning = `Document processed with warnings: ${warnings.slice(0, 3).join("; ")}`;
    }

    return {
      text,
      pageCount: estimatedPageCount,
      isScanned,
      warning,
    };
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error(
      `Failed to extract text from DOCX: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return (
    text
      // Normalize whitespace
      .replace(/[ \t]+/g, " ")
      // Remove excessive newlines
      .replace(/\n{3,}/g, "\n\n")
      // Trim lines
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Trim overall
      .trim()
  );
}
