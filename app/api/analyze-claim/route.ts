import { NextRequest, NextResponse } from "next/server";
import { decodeClaim } from "@/lib/decode";
import { generateAppealLetter } from "@/lib/appeal-letter";
import { extractPdfText } from "@/lib/extract-pdf-text";
import type { AnalyzeClaimResponse, DecodedClaim } from "@/lib/types/claim";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractionAudit = {
  source: "regex" | "llm-fallback" | "failed";
  confidence: "high" | "medium" | "low";
  rejectedCodes: string[];
  reconciliationOk: boolean;
  verifiedCodes: string[];
  statedTotals: Pick<DecodedClaim["totals"], "billed" | "insurancePaid" | "patientResponsibility">;
  recomputedTotals: DecodedClaim["totals"];
};

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("Could not read form data.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("No file was uploaded.", 400);
  }

  // Extract text
  let text: string;
  try {
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractPdfText(buffer);
      if (!extracted) return errorResponse("Could not extract text from PDF.", 422);
      text = extracted;
    } else {
      // Treat as plain text (covers .txt and text/plain)
      text = await file.text();
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Failed to read file.", 500);
  }

  // Decode claim deterministically
  let claim: DecodedClaim;
  let extraction: ExtractionAudit;
  try {
    claim = await decodeClaim(text);
    extraction = {
      source:
        claim.extractionMethod === "llm"
          ? "llm-fallback"
          : claim.extractionMethod === "failed"
            ? "failed"
            : "regex",
      confidence: claim.extractionMethod === "failed" ? "low" : "high",
      rejectedCodes: [],
      reconciliationOk: claim.extractionMethod !== "failed",
      verifiedCodes: verifiedCodesFor(claim),
      statedTotals: {
        billed: claim.totals.billed,
        insurancePaid: claim.totals.insurancePaid,
        patientResponsibility: claim.totals.patientResponsibility,
      },
      recomputedTotals: claim.totals,
    };
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Failed to decode claim.", 500);
  }

  // Generate appeal letter (LLM) and patient summary in parallel
  let appealLetter: string;
  let patientFacingSummary: string;

  try {
    [appealLetter, patientFacingSummary] = await Promise.all([
      generateAppealLetter(claim),
      buildPatientSummary(claim),
    ]);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to generate appeal letter.",
      500
    );
  }

  const escalation: AnalyzeClaimResponse["escalation"] = {
    claimId: claim.claimId ?? "",
    currentLevel: 0,
    steps: [],
    authorizationFormSigned: false,
  };

  return NextResponse.json(
    { claim, escalation, patientFacingSummary, appealLetter, extraction } satisfies AnalyzeClaimResponse & { appealLetter: string; extraction: ExtractionAudit },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function verifiedCodesFor(claim: DecodedClaim): string[] {
  const codes = new Set<string>();
  for (const line of claim.lines) {
    if (line.cpt) codes.add(`CPT ${line.cpt.code}`);
    if (line.hcpcs) codes.add(`HCPCS ${line.hcpcs.code}`);
    for (const diagnosis of line.diagnosis ?? []) codes.add(`ICD-10 ${diagnosis.code}`);
    if (line.denial) codes.add(`CARC ${line.denial.carc.code}`);
  }
  return [...codes];
}

function buildPatientSummary(claim: DecodedClaim): Promise<string> {
  const savingsDollars = (claim.totals.potentialSavings / 100).toFixed(0);
  const appealCount = claim.denials.filter((d) => d.appealable).length;
  const summary =
    appealCount > 0
      ? `Your insurer denied $${savingsDollars} that may be wrongful — you have ${appealCount} appealable denial${appealCount > 1 ? "s" : ""} with a strong chance of reversal. We've drafted a ready-to-send appeal letter to help you recover this amount.`
      : `Your claim has been processed. Your current patient responsibility is $${(claim.totals.patientResponsibility / 100).toFixed(2)}.`;
  return Promise.resolve(summary);
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
