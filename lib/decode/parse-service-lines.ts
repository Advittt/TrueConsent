import type { ClaimLine, ClaimLineDenial } from "@/lib/types/claim";
import {
  buildDenialFromCarc,
  dollarsStringToCents,
  lookupCpt,
  lookupHcpcs,
  lookupCarc,
} from "@/lib/codebook";

/**
 * Parses service lines from EOB table rows (tab or whitespace delimited).
 * <line#> <date> <cpt/hcpcs> <desc...> <billed> <allowed> <paid> <patient> <denial>
 */
export function parseServiceLines(text: string): ClaimLine[] {
  const lines: ClaimLine[] = [];
  const moneyRe = /\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)/g;
  const procRe = /(?:CPT|HCPCS|PROC)?\s*\b([A-Z]\d{4}|\d{5})\b/;
  const carcRe = /\b(CO-\d+|PR-\d+|OA-\d+|PI-\d+)\b/g;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(TOTALS?|TOTAL)\b/i.test(line)) continue;
    if (/^(CO|PR|OA|PI)-\d+\s/.test(line) && !line.includes("$")) continue;

    const procMatch = line.match(procRe);
    if (!procMatch) continue;
    const procCode = procMatch[1];
    const cptCode = lookupCpt(procCode);
    const hcpcsCode = !cptCode ? lookupHcpcs(procCode) : undefined;
    if (!cptCode && !hcpcsCode) continue;

    const amounts = [...line.matchAll(moneyRe)].map((m) => dollarsStringToCents(m[1]));
    if (amounts.length < 2) continue;

    const billed = amounts[0];
    const patientResponsibility = amounts[amounts.length - 1];
    const insurancePaid =
      amounts.length >= 3
        ? amounts[amounts.length - 2]
        : Math.max(0, billed - patientResponsibility);

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

    let denial: ClaimLineDenial | undefined;
    const primaryCarc = rawDenials.find((d) => d.startsWith("CO-"));
    if (primaryCarc) {
      const carcEntry = lookupCarc(primaryCarc);
      if (carcEntry) {
        denial = buildDenialFromCarc(carcEntry);
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
