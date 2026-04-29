import { getClient, ANALYSIS_MODEL } from "@/lib/anthropic";
import type { DecodedClaim } from "@/lib/types/claim";

export async function generateAppealLetter(claim: DecodedClaim): Promise<string> {
  // Find the most impactful appealable denial (highest billed amount)
  const appealableLine = claim.lines
    .filter((l) => l.denial?.appealable)
    .sort((a, b) => b.billed - a.billed)[0];

  if (!appealableLine || !appealableLine.denial) {
    return "No appealable denials were identified on this claim.";
  }

  const denial = appealableLine.denial;
  const procCode = appealableLine.cpt?.code ?? appealableLine.hcpcs?.code ?? "unknown";
  const procDesc = appealableLine.cpt?.description ?? appealableLine.hcpcs?.description ?? "the procedure";
  const billedDollars = (appealableLine.billed / 100).toFixed(2);
  const diagnosis = claim.lines.flatMap((l) => l.diagnosis ?? [])[0];
  const diagText = diagnosis ? `${diagnosis.code} (${diagnosis.description})` : "as documented in the medical record";

  const isMedNecDenial = /not.*medical.*necess|CO-?50/i.test(`${denial.carc.code} ${denial.reason}`);

  const prompt = `Write a formal Level-1 internal insurance appeal letter for the following denied claim. Be concise (~280 words), professional, and cite clinical justification.

Claim details:
- Claim ID: ${claim.claimId ?? "N/A"}
- Member ID: ${claim.memberId ?? "N/A"}
- Patient: ${claim.patientName ?? "the patient"}
- Insurer: ${claim.insurerName ?? "the insurance company"}
- Provider: ${claim.providerName ?? "Memorial Hospital"}
- Service Date: ${claim.serviceDate ?? "June 14, 2026"}
- Procedure Code: ${procCode} — ${procDesc}
- Billed Amount: $${billedDollars}
- Denial Reason: ${denial.carc.code} — ${denial.reason}
- Admitting Diagnosis: ${diagText}

Write the letter from the patient's perspective. Include:
1. Date, insurer address placeholder, reference to claim number
2. The specific denial code and reason
3. Clinical argument for medical necessity based on the admitting diagnosis
4. Citation that ER visits for the documented diagnosis meet standard of care
5. **A formal request, in its own paragraph, for the following information about the physician who reviewed and denied this claim — citing the patient's right under ERISA §503 and applicable state insurance law:**
   - Full name and professional title
   - Medical license number and state(s) of licensure
   - Board certifications and area(s) of specialty
   - Whether they personally reviewed the complete medical record
${isMedNecDenial ? "   Note that this denial cited 'not medically necessary' — a clinical determination that must be made by a qualified peer physician. If the reviewer's specialty does not match the clinical area of the service, that itself is grounds for appeal." : ""}
6. Request for reconsideration at Level 1 within 30 days
7. Polite closing

Do not include placeholders like [YOUR NAME] — use the patient name from the claim details.`;

  const client = getClient();
  const response = await client.messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.type === "text" ? textBlock.text : "Appeal letter generation failed.";
}
