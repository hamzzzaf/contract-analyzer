import { db } from "@/lib/db";
import { getClaudeClient, AnalysisResult } from "./claude-client";
import { analyzeInChunks } from "./chunk-processor";
import { extractText, detectFileType } from "../extraction";
import { getFileBuffer } from "../storage";

export interface AnalyzeContractOptions {
  contractId: string;
}

/**
 * Main function to analyze a contract
 * This handles the full pipeline: fetch file, extract text, analyze with Claude, save results
 */
export async function analyzeContract({
  contractId,
}: AnalyzeContractOptions): Promise<void> {
  console.log(`Starting analysis for contract ${contractId}`);

  // Get the contract from database
  const contract = await db.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new Error(`Contract not found: ${contractId}`);
  }

  try {
    // Update status to processing
    await db.contract.update({
      where: { id: contractId },
      data: { status: "PROCESSING" },
    });

    // Step 1: Get file from S3
    console.log("Fetching file from storage...");
    const fileBuffer = await getFileBuffer(contract.fileKey);

    // Step 2: Extract text
    console.log("Extracting text from document...");
    const fileType = detectFileType(undefined, contract.fileName);

    if (!fileType) {
      throw new Error(`Unsupported file type: ${contract.fileName}`);
    }

    const extractionResult = await extractText(fileBuffer, fileType);

    if (extractionResult.isScanned) {
      console.warn("Warning: Document appears to be scanned");
    }

    if (!extractionResult.text || extractionResult.text.length < 50) {
      throw new Error(
        "Could not extract sufficient text from document. The file may be empty, corrupted, or image-based."
      );
    }

    // Update contract with extracted text and page count
    await db.contract.update({
      where: { id: contractId },
      data: {
        extractedText: extractionResult.text,
        pageCount: extractionResult.pageCount,
      },
    });

    // Step 3: Analyze with Claude
    console.log(
      `Analyzing contract (${extractionResult.tokenEstimate} estimated tokens)...`
    );
    const claudeClient = getClaudeClient();
    const analysisResult = await analyzeInChunks(
      extractionResult.text,
      claudeClient
    );

    // Step 4: Save analysis results
    console.log("Saving analysis results...");
    await saveAnalysisResults(contractId, analysisResult);

    // Update contract status to completed
    await db.contract.update({
      where: { id: contractId },
      data: {
        status: "COMPLETED",
        riskScore: analysisResult.overall_risk_score,
      },
    });

    console.log(`Analysis complete for contract ${contractId}`);
  } catch (error) {
    console.error(`Analysis failed for contract ${contractId}:`, error);

    // Update contract status to failed
    await db.contract.update({
      where: { id: contractId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}

/**
 * Save analysis results to database
 */
async function saveAnalysisResults(
  contractId: string,
  result: AnalysisResult
): Promise<void> {
  // Delete any existing analysis for this contract
  await db.analysis.deleteMany({
    where: { contractId },
  });

  // Create new analysis with clauses
  await db.analysis.create({
    data: {
      contractId,
      riskScore: result.overall_risk_score,
      summary: result.summary,
      riskSummary: result.risk_summary,
      clauses: {
        create: result.clauses.map((clause, index) => ({
          category: clause.category as
            | "PAYMENT_TERMS"
            | "LIABILITY"
            | "INDEMNIFICATION"
            | "TERMINATION"
            | "INTELLECTUAL_PROPERTY"
            | "CONFIDENTIALITY"
            | "NON_COMPETE"
            | "AUTO_RENEWAL"
            | "DISPUTE_RESOLUTION"
            | "DATA_PRIVACY"
            | "FORCE_MAJEURE"
            | "OTHER",
          text: clause.exact_text,
          riskLevel: clause.risk_level as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          explanation: clause.explanation,
          recommendation: clause.recommendation,
          position: index,
        })),
      },
    },
  });
}

/**
 * Re-analyze an existing contract (useful for retries or updated prompts)
 */
export async function reanalyzeContract(contractId: string): Promise<void> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new Error(`Contract not found: ${contractId}`);
  }

  // If we already have extracted text, use it directly
  if (contract.extractedText && contract.extractedText.length > 50) {
    try {
      await db.contract.update({
        where: { id: contractId },
        data: { status: "PROCESSING" },
      });

      const claudeClient = getClaudeClient();
      const analysisResult = await analyzeInChunks(
        contract.extractedText,
        claudeClient
      );

      await saveAnalysisResults(contractId, analysisResult);

      await db.contract.update({
        where: { id: contractId },
        data: {
          status: "COMPLETED",
          riskScore: analysisResult.overall_risk_score,
        },
      });
    } catch (error) {
      await db.contract.update({
        where: { id: contractId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  } else {
    // Need to re-extract text
    await analyzeContract({ contractId });
  }
}
