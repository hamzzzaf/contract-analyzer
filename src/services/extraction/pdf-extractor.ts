// Use legacy build for Node.js (server-side) environments
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  isScanned: boolean;
  warning: string | null;
}

/**
 * Extract text from a PDF buffer
 */
export async function extractPdfText(
  buffer: Buffer
): Promise<PdfExtractionResult> {
  try {
    // Convert Buffer to Uint8Array for pdfjs
    const data = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data,
      useSystemFonts: true,
      // Disable worker for server-side rendering
      isEvalSupported: false,
      useWorkerFetch: false,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    let fullText = "";
    let totalChars = 0;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Sort text items by position for correct reading order
      const items = textContent.items.filter(
        (item): item is TextItem => "str" in item
      );

      // Sort by Y position (top to bottom) then X position (left to right)
      const sortedItems = items.sort((a, b) => {
        const aY = a.transform[5];
        const bY = b.transform[5];
        const aX = a.transform[4];
        const bX = b.transform[4];

        // If Y positions are similar (within 5 units), sort by X
        if (Math.abs(aY - bY) < 5) {
          return aX - bX;
        }
        // Otherwise sort by Y (descending, since PDF Y starts at bottom)
        return bY - aY;
      });

      // Build text with proper spacing
      let pageText = "";
      let lastY: number | null = null;

      for (const item of sortedItems) {
        const currentY = item.transform[5];

        // Add newline if we've moved to a new line
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith(" ")) {
          pageText += " ";
        }

        pageText += item.str;
        lastY = currentY;
        totalChars += item.str.length;
      }

      fullText += pageText + "\n\n";
    }

    // Clean up the text
    fullText = cleanText(fullText);

    // Detect if this is a scanned document (very little text per page)
    const avgCharsPerPage = totalChars / pageCount;
    const isScanned = avgCharsPerPage < 100;

    return {
      text: fullText,
      pageCount,
      isScanned,
      warning: isScanned
        ? "This appears to be a scanned document. Text extraction may be incomplete or inaccurate. Consider using a document with selectable text."
        : null,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`
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

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}
