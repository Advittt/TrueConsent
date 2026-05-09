/**
 * Single seam for CMS-sourced code tables (CPT, HCPCS, ICD-10, CARC).
 * All extraction paths validate through here.
 */
import cptTable from "@/lib/codes/cpt.json";
import hcpcsTable from "@/lib/codes/hcpcs.json";
import icd10Table from "@/lib/codes/icd10.json";
import carcTable from "@/lib/codes/carc.json";
import type { ClaimLine, ClaimLineDenial, DecodedCode } from "@/lib/types/claim";

interface CodeEntry {
  code: string;
  description: string;
}

interface CarcEntry extends CodeEntry {
  appealable: boolean;
  successRate: number;
  appealNotes?: string;
}

const cpt = cptTable as Record<string, CodeEntry>;
const hcpcs = hcpcsTable as Record<string, CodeEntry>;
const icd10 = icd10Table as Record<string, CodeEntry>;
const carc = carcTable as Record<string, CarcEntry>;

export type CarcDecoded = DecodedCode & {
  appealable: boolean;
  successRate: number;
  appealNotes?: string;
};

export function lookupCpt(code: string): DecodedCode | undefined {
  const entry = cpt[code];
  if (!entry) return undefined;
  return { system: "CPT", code: entry.code, description: entry.description };
}

export function lookupHcpcs(code: string): DecodedCode | undefined {
  const entry = hcpcs[code];
  if (!entry) return undefined;
  return { system: "HCPCS", code: entry.code, description: entry.description };
}

export function lookupIcd10(code: string): DecodedCode | undefined {
  const entry = icd10[code];
  if (!entry) return undefined;
  return { system: "ICD10", code: entry.code, description: entry.description };
}

/** CARC / PR / OA keys as stored in carc.json (e.g. CO-50). */
export function lookupCarc(code: string): CarcDecoded | undefined {
  const normalized = code.trim().toUpperCase();
  const entry = carc[normalized];
  if (!entry) return undefined;
  return {
    system: "CARC",
    code: entry.code,
    description: entry.description,
    appealable: entry.appealable,
    successRate: entry.successRate,
    appealNotes: entry.appealNotes,
  };
}

/** Prefer CPT (numeric 5); otherwise HCPCS (letter + 4 digits). */
export function lookupProcedure(code: string): { cpt?: DecodedCode; hcpcs?: DecodedCode } {
  const normalized = code.trim().toUpperCase();
  const cptHit = cpt[normalized];
  if (cptHit) {
    return {
      cpt: { system: "CPT", code: cptHit.code, description: cptHit.description },
    };
  }
  const hcpcsHit = hcpcs[normalized];
  if (hcpcsHit) {
    return {
      hcpcs: {
        system: "HCPCS",
        code: hcpcsHit.code,
        description: hcpcsHit.description,
      },
    };
  }
  return {};
}

export function buildDenialFromCarc(carcCode: CarcDecoded): ClaimLineDenial {
  return {
    carc: carcCode,
    reason: carcCode.description,
    appealable: carcCode.appealable,
    recommendedAction: carcCode.appealNotes ?? "Review and appeal if warranted.",
    successRate: carcCode.successRate,
  };
}

export function statusForLine(
  billed: number,
  insurancePaid: number,
  denial?: ClaimLineDenial
): ClaimLine["status"] {
  if (denial) return insurancePaid > 0 ? "partial" : "denied";
  if (insurancePaid > 0 && insurancePaid < billed) return "partial";
  if (insurancePaid >= billed && billed > 0) return "paid";
  return "pending";
}

export function dollarsStringToCents(s: string): number {
  return Math.round(parseFloat(s.replace(/,/g, "")) * 100);
}

export function dollarsNumberToCents(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 100) : 0;
}
