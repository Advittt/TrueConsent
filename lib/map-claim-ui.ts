import type { AnalyzeClaimResponse, ClaimResult } from "@/lib/types/claim";

/** Maps wire `AnalyzeClaimResponse` into the results-step `ClaimResult` shape. */
export function mapAnalyzeResponseToClaimResult(data: AnalyzeClaimResponse): ClaimResult {
  const c = data.claim;
  return {
    patient: c.patientName ?? "Patient",
    memberId: c.memberId ?? "—",
    insurer: c.insurerName ?? "Insurer",
    claimNumber: c.claimId ?? "—",
    dateOfService: c.serviceDate ?? "—",
    provider: c.providerName ?? "—",
    totalBilled: c.totals.billed,
    totalAllowed: c.totals.billed - c.totals.potentialSavings,
    totalPaid: c.totals.insurancePaid,
    totalDenied: c.totals.potentialSavings,
    documentFlags: c.documentFlags,
    denials: c.lines
      .filter((l) => l.denial)
      .map((l, i) => ({
        id: l.id,
        cpt: l.cpt?.code ?? l.hcpcs?.code ?? `Line ${i + 1}`,
        description: l.cpt?.description ?? l.hcpcs?.description ?? "Service",
        icd10: l.diagnosis?.[0]?.code ?? "—",
        icd10Label: l.diagnosis?.[0]?.description ?? "—",
        billed: l.billed,
        paid: l.insurancePaid,
        denied: l.billed - l.insurancePaid,
        carc: l.denial?.carc.code ?? null,
        carcLabel: l.denial?.carc.description ?? null,
        ourAnalysis: l.denial?.reason ?? null,
        policyRef: null,
        confidence:
          l.denial?.successRate != null ? Math.round(l.denial.successRate * 100) : null,
        strength: (l.denial?.appealable ? "strong" : "weak") as "strong" | "weak",
      })),
  };
}
