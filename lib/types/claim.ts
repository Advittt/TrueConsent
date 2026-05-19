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

export interface TranscriptLine {
  speaker: 'ai' | 'bcbs' | 'system';
  text: string;
  t: number;
}

export type AppStep = 'upload' | 'analyze' | 'results' | 'appeal' | 'call';
