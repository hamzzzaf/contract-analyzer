import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/**
 * Tool definition for structured clause analysis output
 */
export const CLAUSE_ANALYSIS_TOOL: Tool = {
  name: "analyze_contract_clauses",
  description:
    "Analyze a contract and extract categorized clauses with risk assessments",
  input_schema: {
    type: "object" as const,
    properties: {
      summary: {
        type: "string",
        description:
          "2-3 sentence summary of the contract type, parties involved, and main purpose",
      },
      overall_risk_score: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description:
          "Overall risk score from 1 (very safe/favorable) to 10 (very risky/unfavorable)",
      },
      risk_summary: {
        type: "string",
        description:
          "1-2 sentence explanation of the overall risk level and main concerns",
      },
      clauses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: [
                "PAYMENT_TERMS",
                "LIABILITY",
                "INDEMNIFICATION",
                "TERMINATION",
                "INTELLECTUAL_PROPERTY",
                "CONFIDENTIALITY",
                "NON_COMPETE",
                "AUTO_RENEWAL",
                "DISPUTE_RESOLUTION",
                "DATA_PRIVACY",
                "FORCE_MAJEURE",
                "OTHER",
              ],
              description: "The category of the clause",
            },
            exact_text: {
              type: "string",
              description:
                "The exact text from the contract for this clause (or a representative excerpt if very long)",
            },
            risk_level: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              description: "The risk level of this clause",
            },
            explanation: {
              type: "string",
              description:
                "Plain English explanation of what this clause means and why it matters",
            },
            recommendation: {
              type: "string",
              description:
                "Suggested action or negotiation point for this clause",
            },
          },
          required: [
            "category",
            "exact_text",
            "risk_level",
            "explanation",
            "recommendation",
          ],
        },
      },
    },
    required: ["summary", "overall_risk_score", "risk_summary", "clauses"],
  },
};

/**
 * Build the main analysis prompt
 */
export function buildAnalysisPrompt(contractText: string): string {
  return `You are an expert legal contract analyst AI. Your task is to analyze the following contract and identify all significant clauses, with special attention to potentially risky or unfavorable terms.

## Analysis Guidelines

### High-Risk Patterns to Flag
- **Unlimited or uncapped liability** - Any clause that doesn't limit financial exposure
- **Broad indemnification** - Requirements to defend/hold harmless for broad categories of claims
- **Auto-renewal with long notice periods** - Automatic renewals requiring 60+ days notice to cancel
- **Unilateral termination rights** - One party can terminate easily while the other cannot
- **Unfavorable IP assignment** - Broad transfer of intellectual property rights
- **Restrictive non-compete** - Overly broad geographic or time restrictions
- **Unfavorable payment terms** - Net 60+ payment terms, unclear payment obligations
- **Broad confidentiality obligations** - Overly long duration or scope
- **Mandatory arbitration** - Especially in unfavorable jurisdictions
- **Automatic price increases** - Uncapped or unclear pricing changes
- **Liquidated damages** - Pre-set penalty amounts that may be excessive
- **Most Favored Nation clauses** - Requirements to match competitor pricing/terms
- **Assignment restrictions** - Limitations on transferring the contract
- **Warranty disclaimers** - AS-IS provisions or limited warranties

### Risk Level Definitions
- **LOW**: Standard, balanced terms that are typical for this contract type
- **MEDIUM**: Somewhat one-sided terms that warrant attention but are negotiable
- **HIGH**: Significantly unfavorable terms that should be negotiated or carefully considered
- **CRITICAL**: Extremely risky terms that could cause major financial or legal exposure

### Instructions
1. Read the entire contract carefully
2. Identify ALL significant clauses, not just risky ones
3. For each clause, extract the exact relevant text
4. Categorize each clause appropriately
5. Assess risk from the perspective of someone reviewing/signing this contract
6. Provide clear, actionable explanations and recommendations
7. Calculate an overall risk score based on the cumulative risk of all clauses

## Contract Text

${contractText}

---

Analyze this contract thoroughly. Be comprehensive in identifying clauses, but focus your explanations on the most important issues.`;
}

/**
 * Build a prompt for analyzing a chunk of a long contract
 */
export function buildChunkAnalysisPrompt(
  chunkText: string,
  chunkNumber: number,
  totalChunks: number
): string {
  return `You are an expert legal contract analyst AI. You are analyzing part ${chunkNumber} of ${totalChunks} of a long contract.

## Instructions
- Extract and analyze all significant clauses in this section
- Note that this is only a portion of the full contract
- Focus on identifying clauses and their risk levels
- Other sections may contain related terms

## Contract Section ${chunkNumber}/${totalChunks}

${chunkText}

---

Analyze this section and extract all significant clauses.`;
}

/**
 * Build a prompt for synthesizing analysis from multiple chunks
 */
export function buildSynthesisPrompt(
  clauseSummary: string,
  totalClauses: number
): string {
  return `You are an expert legal contract analyst AI. You have analyzed a long contract in sections and found ${totalClauses} total clauses.

Here is a summary of all clauses found:

${clauseSummary}

Based on these findings, provide:
1. A 2-3 sentence summary of the contract
2. An overall risk score (1-10) considering all clauses together
3. A risk summary explaining the main concerns

Consider cumulative risk - multiple medium-risk clauses together may indicate a high overall risk.`;
}
