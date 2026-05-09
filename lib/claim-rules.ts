import type { ClaimLine, ClaimDocumentFlag, DecodedClaim, LineFlag } from "@/lib/types/claim";

const CENTS_TOL = 2;

/** E/M codes where missing diagnosis is suspicious on an EOB line. */
const HIGH_COMPLEXITY_EM = new Set([
  "99204",
  "99205",
  "99214",
  "99215",
  "99233",
  "99234",
  "99235",
  "99285",
  "99291",
]);

function pushFlag(line: ClaimLine, flag: LineFlag): ClaimLine {
  const next = [...(line.flags ?? []), flag];
  return { ...line, flags: next };
}

/**
 * Deterministic checks after decode — no LLM. Adds `line.flags` and `documentFlags`.
 */
export function applyClaimRules(claim: DecodedClaim): DecodedClaim {
  if (claim.lines.length === 0) {
    return { ...claim, documentFlags: claim.documentFlags };
  }

  let lines = claim.lines.map((l): ClaimLine =>
    l.flags ? { ...l, flags: [...l.flags] } : { ...l },
  );

  const procKey = (line: ClaimLine) => line.cpt?.code ?? line.hcpcs?.code;
  const byProc = new Map<string, ClaimLine[]>();
  for (const line of lines) {
    const k = procKey(line);
    if (!k) continue;
    if (!byProc.has(k)) byProc.set(k, []);
    byProc.get(k)!.push(line);
  }
  for (const [code, group] of byProc) {
    if (group.length < 2) continue;
    const explanation = `Procedure ${code} appears on ${group.length} separate lines — verify the payer did not duplicate the same service.`;
    lines = lines.map((line) =>
      group.some((g) => g.id === line.id)
        ? pushFlag(line, { kind: "duplicate", explanation })
        : line
    );
  }

  let sumBilled = 0;
  let sumPaid = 0;
  let sumPatient = 0;
  for (const line of lines) {
    sumBilled += line.billed;
    sumPaid += line.insurancePaid;
    sumPatient += line.patientResponsibility;
  }

  const documentFlags: ClaimDocumentFlag[] = [...(claim.documentFlags ?? [])];
  const parts: string[] = [];
  if (Math.abs(sumBilled - claim.totals.billed) > CENTS_TOL) {
    parts.push(`sum of line billed (${(sumBilled / 100).toFixed(2)}) ≠ header billed (${(claim.totals.billed / 100).toFixed(2)})`);
  }
  if (Math.abs(sumPaid - claim.totals.insurancePaid) > CENTS_TOL) {
    parts.push(`sum of line insurance paid ≠ header insurance paid`);
  }
  if (Math.abs(sumPatient - claim.totals.patientResponsibility) > CENTS_TOL) {
    parts.push(`sum of line patient responsibility ≠ header patient responsibility`);
  }
  if (parts.length > 0) {
    documentFlags.push({
      kind: "totals_mismatch",
      explanation: parts.join("; ") + ".",
    });
  }

  lines = lines.map((line) => {
    const diff = line.billed - line.insurancePaid - line.patientResponsibility;
    if (Math.abs(diff) <= CENTS_TOL) return line;
    return pushFlag(line, {
      kind: "arithmetic",
      explanation: `Line amounts do not reconcile (billed − insurance paid − patient responsibility = ${(diff / 100).toFixed(2)}); possible write-off not shown or parse misalignment.`,
    });
  });

  lines = lines.map((line) => {
    const cpt = line.cpt?.code;
    if (!cpt || !HIGH_COMPLEXITY_EM.has(cpt)) return line;
    if (line.diagnosis && line.diagnosis.length > 0) return line;
    return pushFlag(line, {
      kind: "diagnosis_mismatch",
      explanation: `High-complexity E/M ${cpt} has no diagnosis on this line — verify against the medical record.`,
    });
  });

  return { ...claim, lines, documentFlags };
}
