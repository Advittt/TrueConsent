import type { DecodedClaim, ExtractionAudit, ExtractionAuditSource } from "@/lib/types/claim";

export function verifiedCodesForClaim(claim: DecodedClaim): string[] {
  const codes = new Set<string>();
  for (const line of claim.lines) {
    if (line.cpt) codes.add(`CPT ${line.cpt.code}`);
    if (line.hcpcs) codes.add(`HCPCS ${line.hcpcs.code}`);
    for (const diagnosis of line.diagnosis ?? []) codes.add(`ICD-10 ${diagnosis.code}`);
    if (line.denial) codes.add(`CARC ${line.denial.carc.code}`);
  }
  return [...codes];
}

function extractionSourceFromClaim(claim: DecodedClaim): ExtractionAuditSource {
  if (claim.extractionMethod === "failed" || claim.kind === "unknown") return "failed";
  if (claim.extractionMethod === "llm") return "llm-fallback";
  return "regex";
}

function confidenceFromParts(
  source: ExtractionAuditSource,
  reconciliationOk: boolean,
  rejectedCount: number
): ExtractionAudit["confidence"] {
  if (source === "failed") return "low";
  if (source === "regex") return reconciliationOk ? "high" : "medium";
  if (!reconciliationOk) return "low";
  if (rejectedCount === 0) return "high";
  return "medium";
}

/** Used when `AnalyzeClaimResponse.extraction` was not returned (older clients / demos). */
export function fallbackExtractionAudit(claim: DecodedClaim): ExtractionAudit {
  const source = extractionSourceFromClaim(claim);
  const rejectedCodes: string[] = [];
  const reconciliationOk = claim.extractionMethod !== "failed" && claim.lines.length > 0;
  return {
    source,
    confidence: confidenceFromParts(source, reconciliationOk, rejectedCodes.length),
    rejectedCodes,
    reconciliationOk,
    verifiedCodes: verifiedCodesForClaim(claim),
    statedTotals: {
      billed: claim.totals.billed,
      insurancePaid: claim.totals.insurancePaid,
      patientResponsibility: claim.totals.patientResponsibility,
    },
    recomputedTotals: claim.totals,
  };
}
