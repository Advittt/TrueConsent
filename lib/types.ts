export type Severity = "high" | "medium" | "low";

export interface RedFlag {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  quote: string;
  ask: string;
}

export type Verification = "verified" | "fuzzy" | "unverified" | "n/a";

export interface VerifiedRedFlag extends RedFlag {
  verification: Verification;
  matchScore?: number;
  matchOffset?: number;
}

export interface Analysis {
  summary: string;
  agreements: string[];
  risks: string[];
  redFlags: RedFlag[];
  doctorQuestions: string[];
}

export type Modality =
  | "surgery"
  | "imaging"
  | "telehealth"
  | "dental-implant"
  | "orthodontics"
  | "general"
  | "unknown";

export interface ModalityResult {
  detected: Modality;
  confidence: number;
  signals: string[];
}

export type ClauseTag =
  | "arbitration"
  | "financial-responsibility"
  | "data-sharing"
  | "blanket-consent"
  | "marketing-use"
  | "recording-consent"
  | "anesthesia-waiver"
  | "release-of-liability"
  | "irrevocable-grant"
  | "third-party-disclosure";

export interface PatternHit {
  tag: ClauseTag;
  label: string;
  severity: Severity;
  excerpt: string;
  offset: number;
}

export interface RequiredElement {
  name: string;
  present: boolean;
}

export interface DeterministicChecks {
  textExtracted: boolean;
  textLength: number;
  modality: ModalityResult;
  patternHits: PatternHit[];
  requiredElements: RequiredElement[];
  redFlagsVerified: VerifiedRedFlag[];
  taxonomy: { id: string; tag: ClauseTag | "other"; label: string }[];
  trustScore: number;
}

export interface AnalyzeResponse {
  analysis: Analysis;
  checks: DeterministicChecks | null;
  fileName: string;
  fileSize: number;
  durationMs: number;
}
