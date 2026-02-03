import Anthropic from "@anthropic-ai/sdk";
import {
  CLAUSE_ANALYSIS_TOOL,
  buildAnalysisPrompt,
  buildChunkAnalysisPrompt,
} from "./prompt-builder";

export interface ClauseResult {
  category: string;
  exact_text: string;
  risk_level: string;
  explanation: string;
  recommendation: string;
}

export interface AnalysisResult {
  summary: string;
  overall_risk_score: number;
  risk_summary: string;
  clauses: ClauseResult[];
}

export class ClaudeClient {
  private client: Anthropic;
  private model: string = "claude-sonnet-4-20250514";

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is not set. Please add your Anthropic API key to .env.local"
      );
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Analyze a contract and return structured results
   */
  async analyzeContract(contractText: string): Promise<AnalysisResult> {
    const prompt = buildAnalysisPrompt(contractText);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      tools: [CLAUSE_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "analyze_contract_clauses" },
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the tool use result
    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error("No tool use response received from Claude");
    }

    const result = toolUseBlock.input as AnalysisResult;

    // Validate the result
    if (!result.summary || !result.clauses || !Array.isArray(result.clauses)) {
      throw new Error("Invalid analysis result structure");
    }

    return result;
  }

  /**
   * Analyze a chunk of a long contract
   */
  async analyzeChunk(
    chunkText: string,
    chunkNumber: number,
    totalChunks: number
  ): Promise<AnalysisResult> {
    const prompt = buildChunkAnalysisPrompt(chunkText, chunkNumber, totalChunks);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      tools: [CLAUSE_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "analyze_contract_clauses" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error("No tool use response received from Claude");
    }

    return toolUseBlock.input as AnalysisResult;
  }

  /**
   * Synthesize final analysis from multiple chunk results
   */
  async synthesizeAnalysis(
    allClauses: ClauseResult[],
    chunkSummaries: string[]
  ): Promise<{ summary: string; overall_risk_score: number; risk_summary: string }> {
    // Build a summary of all clauses for synthesis
    const clauseSummary = allClauses
      .map(
        (c, i) =>
          `${i + 1}. [${c.category}] ${c.risk_level}: ${c.explanation.substring(0, 100)}...`
      )
      .join("\n");

    const prompt = `Based on analyzing a long contract, here are the findings:

## Section Summaries
${chunkSummaries.join("\n\n")}

## All Clauses Found (${allClauses.length} total)
${clauseSummary}

## Risk Distribution
- Critical: ${allClauses.filter((c) => c.risk_level === "CRITICAL").length}
- High: ${allClauses.filter((c) => c.risk_level === "HIGH").length}
- Medium: ${allClauses.filter((c) => c.risk_level === "MEDIUM").length}
- Low: ${allClauses.filter((c) => c.risk_level === "LOW").length}

Provide a final summary, overall risk score (1-10), and risk summary for this contract.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      tools: [CLAUSE_ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: "analyze_contract_clauses" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUseBlock = response.content.find(
      (block) => block.type === "tool_use"
    );

    if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
      throw new Error("No tool use response received from Claude");
    }

    const result = toolUseBlock.input as AnalysisResult;

    return {
      summary: result.summary,
      overall_risk_score: result.overall_risk_score,
      risk_summary: result.risk_summary,
    };
  }
}

// Singleton instance
let claudeClientInstance: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!claudeClientInstance) {
    claudeClientInstance = new ClaudeClient();
  }
  return claudeClientInstance;
}
