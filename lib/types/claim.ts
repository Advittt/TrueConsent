// Shared contract — all 4 tracks code against these types.
// DO NOT modify without coordinating across tracks.

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
  // CARC/RARC only:
  appealable?: boolean;
  successRate?: number; // 0..1, historical overturn rate for this denial reason
  appealNotes?: string;
}

export interface ClaimLine {
  id: string;
  cpt?: DecodedCode;
  hcpcs?: DecodedCode;
  modifiers?: DecodedCode[];
  diagnosis?: DecodedCode[]; // ICD-10
  billed: number; // cents
  insurancePaid: number; // cents
  patientResponsibility: number; // cents
  status: "paid" | "denied" | "partial" | "pending";
  denial?: DenialItem;
  flags?: LineFlag[]; // upcoding, duplicate, etc.
}

export interface DenialItem {
  carc: DecodedCode; // claim adjustment reason code
  rarc?: DecodedCode; // remark code
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

export interface DecodedClaim {
  kind: DocumentKind;
  extractionMethod?: "regex" | "llm" | "failed";
  claimId?: string;
  memberId?: string;
  patientName?: string;
  insurerName?: string;
  insurerPhone?: string;
  providerName?: string;
  serviceDate?: string; // ISO
  receivedDate?: string; // ISO
  lines: ClaimLine[];
  totals: {
    billed: number;
    insurancePaid: number;
    patientResponsibility: number;
    potentialSavings: number; // sum of appealable denials
  };
  denials: DenialItem[];
  rawText?: string; // for citation/grounding
}

// Track B — Appeals + Escalation

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

export interface EscalationStep {
  level: EscalationLevel;
  name: string; // e.g. "Internal phone review"
  description: string;
  deadline?: string; // ISO
  status: "pending" | "in_progress" | "complete" | "skipped";
  artifacts?: {
    letterUrl?: string;
    formUrl?: string;
    callRef?: string;
  };
  successRateEstimate?: number;
}

export interface EscalationPlan {
  claimId: string;
  currentLevel: EscalationLevel;
  steps: EscalationStep[];
  authorizationFormSigned: boolean;
}

// Track C — Call

export interface CallSession {
  id: string;
  blandCallId?: string;
  insurerName: string;
  insurerPhone: string;
  status: "queued" | "dialing" | "ivr" | "on_hold" | "connected" | "complete" | "failed";
  startedAt: string;
  endedAt?: string;
  referenceNumber?: string;
  transcript: TranscriptLine[];
  recordingUrl?: string;
}

export interface TranscriptLine {
  t: number; // seconds from call start
  role: "system" | "agent" | "rep";
  text: string;
}

// API response shape — Track D consumes this.
export interface AnalyzeClaimResponse {
  claim: DecodedClaim;
  escalation: EscalationPlan;
  patientFacingSummary: string;
  appealLetter: string;
}
