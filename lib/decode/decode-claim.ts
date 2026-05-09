import type { ClaimLineDenial, DecodedClaim, ExtractionAudit } from "@/lib/types/claim";
import { extractClaimWithLLM } from "@/lib/extract-with-llm";
import { applyClaimRules } from "@/lib/claim-rules";
import { lookupIcd10 } from "@/lib/codebook";
import { parseServiceLines } from "@/lib/decode/parse-service-lines";
import { extractEobMemberMeta } from "@/lib/decode/extract-member-meta";
import { verifiedCodesForClaim } from "@/lib/extraction-audit";

export interface DecodeClaimOutcome {
  claim: DecodedClaim;
  extraction: ExtractionAudit;
}

function hasClaimExtractionSignals(text: string): boolean {
  const moneyCount = text.match(/\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?/g)?.length ?? 0;
  const hasKnownClaimCode =
    /\b(?:CPT|HCPCS)\s+[A-Z]?\d{4,5}\b/i.test(text) ||
    /\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/i.test(text);
  return moneyCount >= 2 && hasKnownClaimCode;
}

function failedClaim(base: DecodedClaim): DecodedClaim {
  return {
    ...base,
    kind: "unknown",
    extractionMethod: "failed",
    lines: [],
    denials: [],
    totals: {
      billed: 0,
      insurancePaid: 0,
      patientResponsibility: 0,
      potentialSavings: 0,
    },
  };
}

function confidenceFor(
  source: ExtractionAudit["source"],
  reconciliationOk: boolean,
  rejectedCount: number
): ExtractionAudit["confidence"] {
  if (source === "failed") return "low";
  if (source === "regex") return reconciliationOk ? "high" : "medium";
  if (!reconciliationOk) return "low";
  if (rejectedCount === 0) return "high";
  return "medium";
}

function lineTotalsReconcile(claim: DecodedClaim): boolean {
  let sumBilled = 0;
  let sumPaid = 0;
  let sumPat = 0;
  for (const line of claim.lines) {
    sumBilled += line.billed;
    sumPaid += line.insurancePaid;
    sumPat += line.patientResponsibility;
  }
  const tol = 2;
  return (
    Math.abs(sumBilled - claim.totals.billed) <= tol &&
    Math.abs(sumPaid - claim.totals.insurancePaid) <= tol &&
    Math.abs(sumPat - claim.totals.patientResponsibility) <= tol
  );
}

function buildBaseClaim(
  text: string,
  lines: import("@/lib/types/claim").ClaimLine[]
): DecodedClaim {
  const meta = extractEobMemberMeta(text);
  const diagDecoded = meta.admittingDiagnosisCode
    ? lookupIcd10(meta.admittingDiagnosisCode)
    : undefined;
  if (diagDecoded) {
    for (const line of lines) {
      line.diagnosis = [diagDecoded];
    }
  }

  let billed = 0;
  let insurancePaid = 0;
  let patientResponsibility = 0;
  let potentialSavings = 0;
  const allDenials: ClaimLineDenial[] = [];

  for (const line of lines) {
    billed += line.billed;
    insurancePaid += line.insurancePaid;
    patientResponsibility += line.patientResponsibility;
    if (line.denial?.appealable) {
      potentialSavings += line.billed;
      allDenials.push(line.denial);
    }
  }

  return {
    kind: "eob",
    claimId: meta.claimId,
    memberId: meta.memberId,
    patientName: meta.patientName,
    insurerName: meta.insurerName,
    providerName: meta.providerName,
    serviceDate: meta.serviceDate,
    lines,
    totals: { billed, insurancePaid, patientResponsibility, potentialSavings },
    denials: allDenials,
    rawText: text,
  } satisfies DecodedClaim;
}

function auditFor(
  claim: DecodedClaim,
  parts: {
    source: ExtractionAudit["source"];
    rejectedCodes: string[];
    reconciliationOk: boolean;
    statedTotals: ExtractionAudit["statedTotals"];
  }
): ExtractionAudit {
  return {
    source: parts.source,
    confidence: confidenceFor(parts.source, parts.reconciliationOk, parts.rejectedCodes.length),
    rejectedCodes: parts.rejectedCodes,
    reconciliationOk: parts.reconciliationOk,
    verifiedCodes: verifiedCodesForClaim(claim),
    statedTotals: parts.statedTotals,
    recomputedTotals: claim.totals,
  };
}

export async function decodeClaimWithExtraction(text: string): Promise<DecodeClaimOutcome> {
  const lines = parseServiceLines(text);
  const draft = buildBaseClaim(text, lines);

  const finalize = (
    claim: DecodedClaim,
    extractionParts: {
      source: ExtractionAudit["source"];
      rejectedCodes: string[];
      reconciliationOk: boolean;
      statedTotals: ExtractionAudit["statedTotals"];
    }
  ): DecodeClaimOutcome => {
    const ruled = applyClaimRules(claim);
    const reconOk =
      extractionParts.reconciliationOk && lineTotalsReconcile(ruled);
    const extraction = auditFor(ruled, { ...extractionParts, reconciliationOk: reconOk });
    return { claim: ruled, extraction };
  };

  if (lines.length >= 2 && draft.totals.billed > 0) {
    const claim: DecodedClaim = { ...draft, extractionMethod: "regex" };
    return finalize(claim, {
      source: "regex",
      rejectedCodes: [],
      reconciliationOk: true,
      statedTotals: {
        billed: claim.totals.billed,
        insurancePaid: claim.totals.insurancePaid,
        patientResponsibility: claim.totals.patientResponsibility,
      },
    });
  }

  if (!hasClaimExtractionSignals(text)) {
    const claim = failedClaim(draft);
    return finalize(claim, {
      source: "failed",
      rejectedCodes: [],
      reconciliationOk: false,
      statedTotals: {
        billed: 0,
        insurancePaid: 0,
        patientResponsibility: 0,
      },
    });
  }

  let llmResult: Awaited<ReturnType<typeof extractClaimWithLLM>>;
  try {
    llmResult = await extractClaimWithLLM(text);
  } catch {
    const claim = failedClaim(draft);
    return finalize(claim, {
      source: "failed",
      rejectedCodes: [],
      reconciliationOk: false,
      statedTotals: {
        billed: draft.totals.billed,
        insurancePaid: draft.totals.insurancePaid,
        patientResponsibility: draft.totals.patientResponsibility,
      },
    });
  }

  if (llmResult.confidence === "low") {
    const claim = failedClaim(draft);
    return finalize(claim, {
      source: "failed",
      rejectedCodes: llmResult.rejectedCodes,
      reconciliationOk: false,
      statedTotals: llmResult.documentStatedTotals,
    });
  }

  const claim: DecodedClaim = {
    ...draft,
    extractionMethod: "llm",
    lines: llmResult.lines,
    totals: llmResult.totals,
    denials: llmResult.denials,
  };

  return finalize(claim, {
    source: "llm-fallback",
    rejectedCodes: llmResult.rejectedCodes,
    reconciliationOk: llmResult.reconciliationOk,
    statedTotals: llmResult.documentStatedTotals,
  });
}
