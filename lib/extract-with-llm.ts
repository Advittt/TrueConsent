import { ANALYSIS_MODEL, getClient } from "@/lib/anthropic";
import cptTable from "@/lib/codes/cpt.json";
import hcpcsTable from "@/lib/codes/hcpcs.json";
import carcTable from "@/lib/codes/carc.json";
import type { ClaimLine, DecodedClaim, DecodedCode, ClaimLineDenial } from "@/lib/types/claim";

interface CodeEntry { code: string; description: string }
interface CarcEntry extends CodeEntry {
  appealable: boolean;
  successRate: number;
  appealNotes?: string;
}
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

const cpt = cptTable as Record<string, CodeEntry>;
const hcpcs = hcpcsTable as Record<string, CodeEntry>;
const carc = carcTable as Record<string, CarcEntry>;
const emptyTotals: DecodedClaim["totals"] = {
  billed: 0,
  insurancePaid: 0,
  patientResponsibility: 0,
  potentialSavings: 0,
};

function dollarsToCents(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value * 100)
    : 0;
}

function lookupProcedure(code: string): { cpt?: DecodedCode; hcpcs?: DecodedCode } {
  const normalized = code.trim().toUpperCase();
  const cptEntry = cpt[normalized];
  if (cptEntry) return {
    cpt: { system: "CPT", code: cptEntry.code, description: cptEntry.description },
  };

  const hcpcsEntry = hcpcs[normalized];
  if (hcpcsEntry) return {
    hcpcs: {
      system: "HCPCS",
      code: hcpcsEntry.code,
      description: hcpcsEntry.description,
    },
  };
  return {};
}

function lookupCarc(code: string): DecodedCode | undefined {
  const entry = carc[code.trim().toUpperCase()];
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

function buildDenial(carcCode: DecodedCode): ClaimLineDenial {
  return {
    carc: carcCode,
    reason: carcCode.description,
    appealable: Boolean(carcCode.appealable),
    recommendedAction: carcCode.appealNotes ?? "Review and appeal if warranted.",
    successRate: carcCode.successRate,
  };
}

function statusForLine(
  billed: number,
  insurancePaid: number,
  denial?: ClaimLineDenial
): ClaimLine["status"] {
  if (denial) return insurancePaid > 0 ? "partial" : "denied";
  if (insurancePaid > 0 && insurancePaid < billed) return "partial";
  if (insurancePaid >= billed && billed > 0) return "paid";
  return "pending";
}

function responseText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => block as { type?: unknown; text?: unknown })
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
}

export async function extractClaimWithLLM(rawText: string): Promise<{
  lines: ClaimLine[];
  denials: ClaimLineDenial[];
  totals: DecodedClaim["totals"];
  rejectedCodes: string[];
  reconciliationOk: boolean;
  confidence: "high" | "medium" | "low";
}> {
  const message = await getClient().messages.create({
    model: ANALYSIS_MODEL,
    max_tokens: 2000,
    system: "You are a medical-claims data extractor. Respond with valid JSON only, no prose.",
    messages: [{
      role: "user",
      content: `Extract service lines from this EOB text. Return exactly:
{"lines":[{"procedureCode":"string CPT or HCPCS exactly as shown","billedDollars":0,"planPaidDollars":0,"patientOwesDollars":0,"carcCodes":["CO-50"],"description":"brief service description from the document"}],"totals":{"totalBilled":0,"totalPaid":0,"totalOwed":0}}

Use numbers for dollars, not strings. Extract only codes and amounts present in the text. Do not infer or invent procedure, HCPCS, CPT, or CARC codes.

EOB text:
${rawText}`,
    }],
  });

  let parsed: ExtractedClaim;
  try {
    parsed = JSON.parse(responseText((message as { content?: unknown }).content)) as ExtractedClaim;
  } catch {
    return {
      lines: [],
      denials: [],
      totals: emptyTotals,
      rejectedCodes: [],
      reconciliationOk: false,
      confidence: "low",
    };
  }

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
      if (carcCode.appealable) lineDenials.push(buildDenial(carcCode));
    }

    const billed = dollarsToCents(extractedLine.billedDollars);
    const insurancePaid = dollarsToCents(extractedLine.planPaidDollars);
    const patientResponsibility = dollarsToCents(extractedLine.patientOwesDollars);
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

  const totals = lines.reduce<DecodedClaim["totals"]>((acc, line) => {
    acc.billed += line.billed;
    acc.insurancePaid += line.insurancePaid;
    acc.patientResponsibility += line.patientResponsibility;
    if (line.denial?.appealable) acc.potentialSavings += line.billed;
    return acc;
  }, { ...emptyTotals });

  const reconciliationOk =
    Math.abs(totals.billed - dollarsToCents(parsed.totals?.totalBilled)) <= 100 &&
    Math.abs(totals.insurancePaid - dollarsToCents(parsed.totals?.totalPaid)) <= 100 &&
    Math.abs(totals.patientResponsibility - dollarsToCents(parsed.totals?.totalOwed)) <= 100;
  const confidence = reconciliationOk
    ? rejectedCodes.length === 0 ? "high" : "medium"
    : "low";

  return { lines, denials, totals, rejectedCodes, reconciliationOk, confidence };
}
