// ─── Handoff UI types ─────────────────────────────────────────────────────────

export type DenialStrength = 'strong' | 'moderate' | 'weak' | 'paid';

export interface DenialItem {
  id: string;
  cpt: string;
  description: string;
  icd10: string;
  icd10Label: string;
  billed: number;
  paid: number;
  denied: number;
  carc: string | null;
  carcLabel: string | null;
  ourAnalysis: string | null;
  policyRef: string | null;
  confidence: number | null;
  strength: DenialStrength;
}

export interface ClaimResult {
  patient: string;
  memberId: string;
  insurer: string;
  claimNumber: string;
  dateOfService: string;
  provider: string;
  totalBilled: number;
  totalAllowed: number;
  totalPaid: number;
  totalDenied: number;
  denials: DenialItem[];
}

export interface AppealLetter {
  claimId: string;
  content: string;
  citations: string[];
  grounds: number;
  winRate: number;
}

export type CallStatus = 'initiating' | 'connecting' | 'active' | 'complete' | 'failed';

export interface TranscriptLine {
  speaker: 'ai' | 'bcbs' | 'system';
  text: string;
  timestamp: number;
}

export interface CallState {
  callId: string;
  status: CallStatus;
  durationMs: number;
  transcript: TranscriptLine[];
  referenceNumber?: string;
}

export type AppStep = 'upload' | 'analyze' | 'results' | 'appeal' | 'call';

// ─── Legacy API types (used by existing API routes) ───────────────────────────

export type DocumentKind =
  | "eob"
  | "denial_letter"
  | "itemized_bill"
  | "prior_auth_denial"
  | "collection_notice"
  | "insurance_card"
  | "unknown";

export type CodeSystem = "CPT" | "HCPCS" | "ICD10" | "CARC" | "RARC" | "MOD";

export interface DecodedCode {
  system: CodeSystem;
  code: string;
  description: string;
  appealable?: boolean;
  successRate?: number;
  appealNotes?: string;
}

export interface ClaimLineDenial {
  carc: DecodedCode;
  rarc?: DecodedCode;
  reason: string;
  appealable: boolean;
  recommendedAction: string;
  successRate?: number;
}

export type LineFlag =
  | { kind: "upcoding"; explanation: string }
  | { kind: "duplicate"; explanation: string }
  | { kind: "unbundling"; explanation: string }
  | { kind: "modifier_mismatch"; explanation: string }
  | { kind: "diagnosis_mismatch"; explanation: string };

export interface ClaimLine {
  id: string;
  cpt?: DecodedCode;
  hcpcs?: DecodedCode;
  modifiers?: DecodedCode[];
  diagnosis?: DecodedCode[];
  billed: number;
  insurancePaid: number;
  patientResponsibility: number;
  status: "paid" | "denied" | "partial" | "pending";
  denial?: ClaimLineDenial;
  flags?: LineFlag[];
}

export interface DecodedClaim {
  kind: DocumentKind;
  extractionMethod?: "regex" | "llm" | "failed";
  claimId?: string;
  memberId?: string;
  patientName?: string;
  insurerName?: string;
  insurerPhone?: string;
  providerName?: string;
  serviceDate?: string;
  receivedDate?: string;
  lines: ClaimLine[];
  totals: {
    billed: number;
    insurancePaid: number;
    patientResponsibility: number;
    potentialSavings: number;
  };
  denials: ClaimLineDenial[];
  rawText?: string;
}

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export interface EscalationStep {
  level: EscalationLevel;
  name: string;
  description: string;
  deadline?: string;
  status: "pending" | "in_progress" | "complete" | "skipped";
  artifacts?: { letterUrl?: string; formUrl?: string; callRef?: string };
  successRateEstimate?: number;
}

export interface EscalationPlan {
  claimId: string;
  currentLevel: EscalationLevel;
  steps: EscalationStep[];
  authorizationFormSigned: boolean;
}

export interface ApiTranscriptLine {
  t: number;
  role: "system" | "agent" | "rep";
  text: string;
}

export interface CallSession {
  id: string;
  blandCallId?: string;
  insurerName: string;
  insurerPhone: string;
  status: "queued" | "dialing" | "ivr" | "on_hold" | "connected" | "complete" | "failed";
  startedAt: string;
  endedAt?: string;
  referenceNumber?: string;
  transcript: ApiTranscriptLine[];
  recordingUrl?: string;
}

export interface AnalyzeClaimResponse {
  claim: DecodedClaim;
  escalation: EscalationPlan;
  patientFacingSummary: string;
  appealLetter: string;
}
