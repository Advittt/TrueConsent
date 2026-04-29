import type {
  ClaimLine,
  DecodedClaim,
  DecodedCode,
  DenialItem,
} from "@/lib/types/claim";
import { extractClaimWithLLM } from "@/lib/extract-with-llm";
import cptTable from "@/lib/codes/cpt.json";
import hcpcsTable from "@/lib/codes/hcpcs.json";
import icd10Table from "@/lib/codes/icd10.json";
import carcTable from "@/lib/codes/carc.json";

// ── Type stubs for the JSON tables ──────────────────────────────────────────

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

// ── extractCodes ─────────────────────────────────────────────────────────────

export interface ExtractedCodes {
  cpt: string[];
  hcpcs: string[];
  icd10: string[];
  carc: string[];
  rarc: string[];
}

export function extractCodes(text: string): ExtractedCodes {
  const cptMatches = [...text.matchAll(/\b(\d{5})\b/g)].map((m) => m[1]);
  const hcpcsMatches = [...text.matchAll(/\b([A-Z]\d{4})\b/g)].map((m) => m[1]);
  // ICD-10: letter + digit + alphanumeric(1-2) + optional dot + optional alphanumeric(1-2)
  const icd10Matches = [
    ...text.matchAll(/\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g),
  ].map((m) => m[1]);
  // CARC: CO-XX, PR-XX, OA-XX
  const carcMatches = [...text.matchAll(/\b(CO-\d+|PR-\d+|OA-\d+)\b/g)].map(
    (m) => m[1]
  );
  // RARC: N or M + digits
  const rarcMatches = [...text.matchAll(/\bRARC\s+([NM]\d+)\b|\b([NM]\d{2,4})\b/g)].map(
    (m) => m[1] ?? m[2]
  );

  return {
    cpt: [...new Set(cptMatches)],
    hcpcs: [...new Set(hcpcsMatches)],
    icd10: [...new Set(icd10Matches)],
    carc: [...new Set(carcMatches)],
    rarc: [...new Set(rarcMatches)],
  };
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

function lookupCpt(code: string): DecodedCode | undefined {
  const entry = cpt[code];
  if (!entry) return undefined;
  return { system: "CPT", code: entry.code, description: entry.description };
}

function lookupHcpcs(code: string): DecodedCode | undefined {
  const entry = hcpcs[code];
  if (!entry) return undefined;
  return { system: "HCPCS", code: entry.code, description: entry.description };
}

function lookupIcd10(code: string): DecodedCode | undefined {
  const entry = icd10[code];
  if (!entry) return undefined;
  return { system: "ICD10", code: entry.code, description: entry.description };
}

function lookupCarc(code: string): (DecodedCode & { appealable: boolean; successRate: number; appealNotes?: string }) | undefined {
  const entry = carc[code];
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

function dollarsToCents(s: string): number {
  return Math.round(parseFloat(s.replace(/,/g, "")) * 100);
}

function cleanInlineField(value: string | undefined): string | undefined {
  return value
    ?.replace(/\s+(Member ID|Group Number|Plan Name|Claim (?:Number|#|No)\.?)\b.*$/i, "")
    .trim();
}

function failedClaim(baseClaim: DecodedClaim): DecodedClaim {
  return {
    ...baseClaim,
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

function hasClaimExtractionSignals(text: string): boolean {
  const moneyCount = text.match(/\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?/g)?.length ?? 0;
  const hasKnownClaimCode =
    /\b(?:CPT|HCPCS)\s+[A-Z]?\d{4,5}\b/i.test(text) ||
    /\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/i.test(text);
  return moneyCount >= 2 && hasKnownClaimCode;
}

// ── Line parser ───────────────────────────────────────────────────────────────
// Parses service lines from EOB table rows.
// Expected row format (tab or whitespace delimited):
// <line#> <date> <cpt/hcpcs> <desc...> <billed> <allowed> <paid> <patient> <denial>

function parseServiceLines(text: string): ClaimLine[] {
  const lines: ClaimLine[] = [];
  const moneyRe = /\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)/g;
  const procRe = /(?:CPT|HCPCS|PROC)?\s*\b([A-Z]\d{4}|\d{5})\b/;
  const carcRe = /\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/g;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // Skip totals row (no procedure code) and glossary rows (e.g., "CO-50 description")
    if (/^(TOTALS?|TOTAL)\b/i.test(line)) continue;
    if (/^(CO|PR|OA|PI)-\d+\s/.test(line) && !line.includes("$")) continue;

    const procMatch = line.match(procRe);
    if (!procMatch) continue;
    const procCode = procMatch[1];
    const cptCode = lookupCpt(procCode);
    const hcpcsCode = !cptCode ? lookupHcpcs(procCode) : undefined;
    if (!cptCode && !hcpcsCode) continue;

    // Money amounts in order: billed, plan paid, you owe (3 amounts).
    // Some EOBs include allowed; we'll take first as billed and last as patient owe.
    const amounts = [...line.matchAll(moneyRe)].map((m) => dollarsToCents(m[1]));
    if (amounts.length < 2) continue;

    const billed = amounts[0];
    const patientResponsibility = amounts[amounts.length - 1];
    // Plan paid = middle amount if 3+, otherwise infer
    const insurancePaid =
      amounts.length >= 3 ? amounts[amounts.length - 2] : Math.max(0, billed - patientResponsibility);

    // Pull CARC codes from anywhere on the line
    const rawDenials = [...line.matchAll(carcRe)].map((m) => m[1]);

    let status: ClaimLine["status"];
    if (insurancePaid === 0 && billed > 0 && rawDenials.some((d) => d.startsWith("CO-"))) {
      status = "denied";
    } else if (insurancePaid > 0 && insurancePaid < billed) {
      status = "partial";
    } else if (insurancePaid >= billed && billed > 0) {
      status = "paid";
    } else {
      status = "pending";
    }

    let denial: DenialItem | undefined;
    const primaryCarc = rawDenials.find((d) => d.startsWith("CO-"));
    if (primaryCarc) {
      const carcEntry = lookupCarc(primaryCarc);
      if (carcEntry) {
        denial = {
          carc: carcEntry,
          reason: carcEntry.description,
          appealable: carcEntry.appealable,
          recommendedAction: carcEntry.appealNotes ?? "Review and appeal if warranted.",
          successRate: carcEntry.successRate,
        };
      }
    }

    lines.push({
      id: `line-${lines.length + 1}`,
      ...(cptCode ? { cpt: cptCode } : {}),
      ...(hcpcsCode ? { hcpcs: hcpcsCode } : {}),
      billed,
      insurancePaid,
      patientResponsibility,
      status,
      ...(denial ? { denial } : {}),
    });
  }

  return lines;
}

// ── decodeClaim ───────────────────────────────────────────────────────────────

export async function decodeClaim(text: string): Promise<DecodedClaim> {
  // Member info via simple regexes
  const memberIdMatch = text.match(/Member\s+ID[:\s]+([A-Z0-9-]+)/i);
  const claimIdMatch = text.match(/Claim\s+(?:Number|#|No)[.:\s]+([A-Z0-9-]+)/i);
  const memberNameMatch = text.match(/Member\s+Name[:\s]+([^\n\r]+)/i);
  const insurerNameMatch = text.match(/^(BlueCross[^\n\r]*|Aetna[^\n\r]*|UnitedHealth[^\n\r]*|Cigna[^\n\r]*|Humana[^\n\r]*)/im);
  const providerMatch = text.match(/^Provider(?:\s*:|\s+)(?!&\s*SERVICE\b)([^\n\r]+)/im);
  const serviceDateMatch = text.match(/Date\s+of\s+Service[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{2}\/\d{2}\/\d{4})/i);
  const diagnosisMatch = text.match(/Admitting\s+Diagnosis[:\s]+([A-Z]\d{2}\.?\d*)/i);

  // Parse service lines
  const lines = parseServiceLines(text);

  // Attach diagnosis to all lines if found
  const diagCode = diagnosisMatch?.[1];
  const diagDecoded = diagCode ? lookupIcd10(diagCode) : undefined;
  if (diagDecoded) {
    for (const line of lines) {
      line.diagnosis = [diagDecoded];
    }
  }

  // Compute totals
  let billed = 0, insurancePaid = 0, patientResponsibility = 0, potentialSavings = 0;
  const allDenials: DenialItem[] = [];

  for (const line of lines) {
    billed += line.billed;
    insurancePaid += line.insurancePaid;
    patientResponsibility += line.patientResponsibility;
    if (line.denial?.appealable) {
      potentialSavings += line.billed;
      allDenials.push(line.denial);
    }
  }

  // Parse service date to ISO
  let serviceDate: string | undefined;
  if (serviceDateMatch?.[1]) {
    const raw = serviceDateMatch[1];
    const d = new Date(raw);
    if (!isNaN(d.getTime())) serviceDate = d.toISOString().split("T")[0];
  }

  const baseClaim = {
    kind: "eob",
    claimId: claimIdMatch?.[1]?.trim(),
    memberId: memberIdMatch?.[1]?.trim(),
    patientName: cleanInlineField(memberNameMatch?.[1]),
    insurerName: insurerNameMatch?.[1]?.trim(),
    providerName: providerMatch?.[1]?.trim(),
    serviceDate,
    lines,
    totals: { billed, insurancePaid, patientResponsibility, potentialSavings },
    denials: allDenials,
    rawText: text,
  } satisfies DecodedClaim;

  if (lines.length >= 2 && billed > 0) {
    return { ...baseClaim, extractionMethod: "regex" };
  }

  if (!hasClaimExtractionSignals(text)) {
    return failedClaim(baseClaim);
  }

  let llmResult: Awaited<ReturnType<typeof extractClaimWithLLM>>;
  try {
    llmResult = await extractClaimWithLLM(text);
  } catch {
    return failedClaim(baseClaim);
  }

  if (llmResult.confidence === "low") {
    return failedClaim(baseClaim);
  }

  return {
    ...baseClaim,
    extractionMethod: "llm",
    lines: llmResult.lines,
    totals: llmResult.totals,
    denials: llmResult.denials,
  };
}
