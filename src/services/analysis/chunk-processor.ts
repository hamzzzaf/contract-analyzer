import { ClaudeClient, ClauseResult, AnalysisResult } from "./claude-client";
import { estimateTokenCount } from "../extraction";

// Maximum tokens per chunk (leaving room for prompt and response)
const MAX_TOKENS_PER_CHUNK = 80000;
// Character overlap between chunks to maintain context
const OVERLAP_CHARS = 2000;

/**
 * Split text into chunks that fit within token limits
 */
export function splitIntoChunks(text: string): string[] {
  const estimatedTokens = estimateTokenCount(text);

  // If it fits in one chunk, return as-is
  if (estimatedTokens <= MAX_TOKENS_PER_CHUNK) {
    return [text];
  }

  const chunks: string[] = [];
  const charsPerToken = text.length / estimatedTokens;
  const maxCharsPerChunk = Math.floor(MAX_TOKENS_PER_CHUNK * charsPerToken);

  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = Math.min(startIndex + maxCharsPerChunk, text.length);

    // Try to break at a paragraph or sentence boundary
    if (endIndex < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf("\n\n", endIndex);
      if (paragraphBreak > startIndex + maxCharsPerChunk * 0.5) {
        endIndex = paragraphBreak;
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf(". ", endIndex);
        if (sentenceBreak > startIndex + maxCharsPerChunk * 0.5) {
          endIndex = sentenceBreak + 1;
        }
      }
    }

    chunks.push(text.substring(startIndex, endIndex).trim());

    // Move start index, accounting for overlap
    startIndex = endIndex - OVERLAP_CHARS;
    if (startIndex < 0) startIndex = 0;

    // Prevent infinite loop
    if (startIndex >= text.length - 100) break;
  }

  return chunks;
}

/**
 * Deduplicate clauses that might appear in overlapping chunks
 */
export function deduplicateClauses(clauses: ClauseResult[]): ClauseResult[] {
  const seen = new Map<string, ClauseResult>();

  for (const clause of clauses) {
    // Create a key based on the first 100 chars of the exact text
    const key = clause.exact_text.substring(0, 100).toLowerCase().trim();

    // If we've seen a similar clause, keep the one with higher risk
    const existing = seen.get(key);
    if (existing) {
      const riskOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const existingRisk = riskOrder[existing.risk_level as keyof typeof riskOrder] || 0;
      const newRisk = riskOrder[clause.risk_level as keyof typeof riskOrder] || 0;

      if (newRisk > existingRisk) {
        seen.set(key, clause);
      }
    } else {
      seen.set(key, clause);
    }
  }

  return Array.from(seen.values());
}

/**
 * Analyze a long contract by processing it in chunks
 */
export async function analyzeInChunks(
  contractText: string,
  claudeClient: ClaudeClient
): Promise<AnalysisResult> {
  const chunks = splitIntoChunks(contractText);

  // If only one chunk, analyze directly
  if (chunks.length === 1) {
    return claudeClient.analyzeContract(contractText);
  }

  console.log(`Contract split into ${chunks.length} chunks for analysis`);

  // Analyze each chunk
  const chunkResults: AnalysisResult[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Analyzing chunk ${i + 1}/${chunks.length}...`);
    const result = await claudeClient.analyzeChunk(
      chunks[i],
      i + 1,
      chunks.length
    );
    chunkResults.push(result);
  }

  // Collect all clauses and deduplicate
  const allClauses = chunkResults.flatMap((r) => r.clauses);
  const deduplicatedClauses = deduplicateClauses(allClauses);

  // Get summaries from each chunk
  const chunkSummaries = chunkResults.map(
    (r, i) => `Section ${i + 1}: ${r.summary}`
  );

  // Synthesize final analysis
  console.log("Synthesizing final analysis...");
  const synthesis = await claudeClient.synthesizeAnalysis(
    deduplicatedClauses,
    chunkSummaries
  );

  return {
    summary: synthesis.summary,
    overall_risk_score: synthesis.overall_risk_score,
    risk_summary: synthesis.risk_summary,
    clauses: deduplicatedClauses,
  };
}
