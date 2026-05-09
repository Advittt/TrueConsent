import { decodeClaimWithExtraction } from "@/lib/decode/decode-claim";
import { generateAppealLetter } from "@/lib/appeal-letter";
import type { AnalyzeClaimResponse, DecodedClaim, ExtractionAudit } from "@/lib/types/claim";

function buildPatientSummary(claim: DecodedClaim): string {
  const savingsDollars = (claim.totals.potentialSavings / 100).toFixed(0);
  const appealCount = claim.denials.filter((d) => d.appealable).length;
  return appealCount > 0
    ? `Your insurer denied $${savingsDollars} that may be wrongful — you have ${appealCount} appealable denial${appealCount > 1 ? "s" : ""} with a strong chance of reversal. We've drafted a ready-to-send appeal letter to help you recover this amount.`
    : `Your claim has been processed. Your current patient responsibility is $${(claim.totals.patientResponsibility / 100).toFixed(2)}.`;
}

export type AnalyzeClaimPayload = AnalyzeClaimResponse & { extraction: ExtractionAudit };

/**
 * Full server-side pipeline: decode (+ rules + extraction audit), appeal letter, summary.
 * Call from the HTTP route or tests — keeps the route adapter thin.
 */
export async function analyzeClaimFromText(text: string): Promise<AnalyzeClaimPayload> {
  const { claim, extraction } = await decodeClaimWithExtraction(text);

  const [appealLetter, patientFacingSummary] = await Promise.all([
    generateAppealLetter(claim),
    Promise.resolve(buildPatientSummary(claim)),
  ]);

  const escalation: AnalyzeClaimResponse["escalation"] = {
    claimId: claim.claimId ?? "",
    currentLevel: 0,
    steps: [],
    authorizationFormSigned: false,
  };

  return {
    claim,
    escalation,
    patientFacingSummary,
    appealLetter,
    extraction,
  };
}
