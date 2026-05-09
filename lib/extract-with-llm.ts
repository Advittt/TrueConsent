import { ANALYSIS_MODEL, getClient } from "@/lib/anthropic";
import type { ClaimLine, DecodedClaim, ClaimLineDenial } from "@/lib/types/claim";
import {
  buildDenialFromCarc,
  dollarsNumberToCents,
  lookupCarc,
  lookupProcedure,
  statusForLine,
} from "@/lib/codebook";

interface ExtractedLine {
  procedureCode?: string;
  billedDollars?: number;
  planPaidDollars?: number;
  patientOwesDollars?: number;
  carcCodes?: string[];
}
interface ExtractedClaim {
  lines?: ExtractedLine[];
  totals?: { totalBilled?: number; totalPaid?: number; totalOwed?: number };
}

const emptyTotals: DecodedClaim["totals"] = {
  billed: 0,
  insurancePaid: 0,
  patientResponsibility: 0,
  potentialSavings: 0,
};

function responseText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => block as { type?: unknown; text?: unknown })
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
}

export type LlmExtractResult = {
  lines: ClaimLine[];
  denials: ClaimLineDenial[];
  totals: DecodedClaim["totals"];
  rejectedCodes: string[];
  reconciliationOk: boolean;
  confidence: "high" | "medium" | "low";
  /** Dollar totals as stated in the model JSON (for audit / reconciliation UI). */
  documentStatedTotals: Pick<
    DecodedClaim["totals"],
    "billed" | "insurancePaid" | "patientResponsibility"
  >;
};

export async function extractClaimWithLLM(rawText: string): Promise<LlmExtractResult> {
  const message = await getClient().messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 2000,
    system: "You are a medical-claims data extractor. Respond with valid JSON only, no prose.",
    messages: [
      {
        role: "user",
        content: `Extract service lines from this EOB text. Return exactly:
{"lines":[{"procedureCode":"string CPT or HCPCS exactly as shown","billedDollars":0,"planPaidDollars":0,"patientOwesDollars":0,"carcCodes":["CO-50"],"description":"brief service description from the document"}],"totals":{"totalBilled":0,"totalPaid":0,"totalOwed":0}}

Use numbers for dollars, not strings. Extract only codes and amounts present in the text. Do not infer or invent procedure, HCPCS, CPT, or CARC codes.

EOB text:
${rawText}`,
      },
    ],
  });

  let parsed: ExtractedClaim;
  try {
    parsed = JSON.parse(
      responseText((message as { content?: unknown }).content)
    ) as ExtractedClaim;
  } catch {
    return {
      lines: [],
      denials: [],
      totals: emptyTotals,
      rejectedCodes: [],
      reconciliationOk: false,
      confidence: "low",
      documentStatedTotals: { ...emptyTotals },
    };
  }

  const documentStatedTotals = {
    billed: dollarsNumberToCents(parsed.totals?.totalBilled),
    insurancePaid: dollarsNumberToCents(parsed.totals?.totalPaid),
    patientResponsibility: dollarsNumberToCents(parsed.totals?.totalOwed),
  };

  const rejectedCodes: string[] = [];
  const lines: ClaimLine[] = [];
  const denials: ClaimLineDenial[] = [];
  for (const extractedLine of parsed.lines ?? []) {
    const procedureCode = extractedLine.procedureCode?.trim();
    if (!procedureCode) continue;

    const procedure = lookupProcedure(procedureCode);
    if (!procedure.cpt && !procedure.hcpcs) {
      rejectedCodes.push(procedureCode);
      continue;
    }

    const lineDenials: ClaimLineDenial[] = [];
    for (const rawCode of extractedLine.carcCodes ?? []) {
      const carcCode = lookupCarc(rawCode);
      if (!carcCode) {
        rejectedCodes.push(rawCode);
        continue;
      }
      if (carcCode.appealable) lineDenials.push(buildDenialFromCarc(carcCode));
    }

    const billed = dollarsNumberToCents(extractedLine.billedDollars);
    const insurancePaid = dollarsNumberToCents(extractedLine.planPaidDollars);
    const patientResponsibility = dollarsNumberToCents(extractedLine.patientOwesDollars);
    const denial = lineDenials[0];
    denials.push(...lineDenials);
    lines.push({
      id: `llm-line-${lines.length + 1}`,
      ...procedure,
      billed,
      insurancePaid,
      patientResponsibility,
      status: statusForLine(billed, insurancePaid, denial),
      ...(denial ? { denial } : {}),
    });
  }

  const totals = lines.reduce<DecodedClaim["totals"]>(
    (acc, line) => {
      acc.billed += line.billed;
      acc.insurancePaid += line.insurancePaid;
      acc.patientResponsibility += line.patientResponsibility;
      if (line.denial?.appealable) acc.potentialSavings += line.billed;
      return acc;
    },
    { ...emptyTotals }
  );

  const reconciliationOk =
    Math.abs(totals.billed - documentStatedTotals.billed) <= 100 &&
    Math.abs(totals.insurancePaid - documentStatedTotals.insurancePaid) <= 100 &&
    Math.abs(totals.patientResponsibility - documentStatedTotals.patientResponsibility) <=
      100;
  const confidence = reconciliationOk
    ? rejectedCodes.length === 0
      ? "high"
      : "medium"
    : "low";

  return {
    lines,
    denials,
    totals,
    rejectedCodes,
    reconciliationOk,
    confidence,
    documentStatedTotals,
  };
}
