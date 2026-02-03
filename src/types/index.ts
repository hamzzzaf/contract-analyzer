// Enums matching Prisma schema
export enum Plan {
  FREE = "FREE",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export enum ContractStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum ClauseCategory {
  PAYMENT_TERMS = "PAYMENT_TERMS",
  LIABILITY = "LIABILITY",
  INDEMNIFICATION = "INDEMNIFICATION",
  TERMINATION = "TERMINATION",
  INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY",
  CONFIDENTIALITY = "CONFIDENTIALITY",
  NON_COMPETE = "NON_COMPETE",
  AUTO_RENEWAL = "AUTO_RENEWAL",
  DISPUTE_RESOLUTION = "DISPUTE_RESOLUTION",
  DATA_PRIVACY = "DATA_PRIVACY",
  FORCE_MAJEURE = "FORCE_MAJEURE",
  OTHER = "OTHER",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Contract types
export interface Contract {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  pageCount: number | null;
  extractedText: string | null;
  status: ContractStatus;
  riskScore: number | null;
  analysis?: Analysis | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analysis {
  id: string;
  contractId: string;
  riskScore: number;
  summary: string;
  riskSummary: string;
  clauses: Clause[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Clause {
  id: string;
  analysisId: string;
  category: ClauseCategory;
  text: string;
  riskLevel: RiskLevel;
  explanation: string;
  recommendation?: string | null;
  position: number;
  pageNumber: number | null;
}

// API types
export interface UploadPresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface CreateContractRequest {
  fileName: string;
  fileKey: string;
  fileSize: number;
  contentType: string;
}

export interface AnalysisResult {
  summary: string;
  overall_risk_score: number;
  risk_summary: string;
  clauses: {
    category: ClauseCategory;
    exact_text: string;
    risk_level: RiskLevel;
    explanation: string;
    recommendation?: string;
  }[];
}

// Extraction types
export interface ExtractionResult {
  text: string;
  pageCount: number;
  isScanned: boolean;
  warning: string | null;
}

// User types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  plan: Plan;
  stripeCustomerId: string | null;
  contractsAnalyzed: number;
  monthlyLimit: number;
  createdAt: Date;
  updatedAt: Date;
}
