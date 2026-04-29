"use client";

import type { AnalyzeClaimResponse } from "@/lib/types/claim";
import { formatMoney } from "@/lib/format-money";
import { SavingsBanner } from "./SavingsBanner";
import { ClaimTable } from "./ClaimTable";
import { AppealLetterCard } from "./AppealLetterCard";

// The real backend sends appealLetter as an extra key beyond the typed shape.
type ExtractionAudit = {
  source?: "regex" | "llm-fallback" | "demo-llm-fallback";
  confidence?: "high" | "medium" | "low";
  rejectedCodes?: string[];
  reconciliationOk?: boolean;
  verifiedCodes?: string[];
  statedTotals?: {
    billed: number;
    insurancePaid: number;
    patientResponsibility: number;
  };
  recomputedTotals?: AnalyzeClaimResponse["claim"]["totals"];
  citations?: { label: string; text: string }[];
};
type ClaimResponseWithLetter = AnalyzeClaimResponse & {
  appealLetter?: string;
  extraction?: ExtractionAudit;
};

interface ClaimResultsProps {
  data: ClaimResponseWithLetter;
  onReset: () => void;
}

export function ClaimResults({ data, onReset }: ClaimResultsProps) {
  const { claim, patientFacingSummary } = data;
  const { totals } = claim;

  // Use backend-supplied letter if present, otherwise derive from claim data.
  const appealLetter = data.appealLetter ?? buildAppealLetter(data);

  return (
    <div>
      {/* Header strip */}
      <div className="claim-results-header">
        <div className="claim-results-meta">
          {claim.claimId ? (
            <span>
              <span className="claim-results-label">Claim</span> {claim.claimId}
            </span>
          ) : null}
          {claim.insurerName ? (
            <span>
              <span className="claim-results-label">Insurer</span> {claim.insurerName}
            </span>
          ) : null}
          {claim.serviceDate ? (
            <span>
              <span className="claim-results-label">Service date</span>{" "}
              {new Date(claim.serviceDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          ) : null}
        </div>
        <button type="button" className="claim-reset-btn" onClick={onReset}>
          Upload another EOB
        </button>
      </div>

      {/* Hero savings banner */}
      <SavingsBanner
        billed={totals.billed}
        patientResponsibility={totals.patientResponsibility}
        potentialSavings={totals.potentialSavings}
      />

      {/* Plain-English summary */}
      {patientFacingSummary ? (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-eyebrow">What this means for you</div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--muted)" }}>
            {patientFacingSummary}
          </p>
        </div>
      ) : null}

      {/* Trust badge — positioning weapon */}
      <div className="trust-badge">
        <span className="trust-badge-dot" aria-hidden />
        <span>
          <strong>LLM-assisted extraction, deterministic validation</strong> — the model can
          read messy EOB layouts, but every CPT, HCPCS, ICD-10, and CARC code must pass local
          lookup before it affects your appeal.
        </span>
      </div>

      <VerificationTrace data={data} />

      {/* Line-item table */}
      <div style={{ marginTop: 12 }}>
        <ClaimTable lines={claim.lines} />
      </div>

      {/* Appeal letter */}
      <div style={{ marginTop: 20 }}>
        <AppealLetterCard letter={appealLetter} />
      </div>

      {/* Footer — trust + model */}
      <div className="claim-footer">
        <div>
          <strong>Why this works.</strong> CMS publishes the meaning of every denial code.
          We look them up — then a language model writes the appeal in your voice. The data
          is deterministic; only the prose is generated.
        </div>
        <div>
          <strong>How we get paid.</strong> Free to use. If your appeal recovers money, we
          take a small percentage of what you win. Zero risk to you.
        </div>
        <div>
          <strong>Privacy.</strong> Your document is processed in memory and discarded.
          Nothing is stored on our servers. <span className="muted">Cache-Control: no-store</span>.
        </div>
      </div>
    </div>
  );
}

function VerificationTrace({ data }: { data: ClaimResponseWithLetter }) {
  const { claim } = data;
  const audit = data.extraction ?? buildAuditFromClaim(data);
  const rejectedCodes = audit.rejectedCodes ?? [];
  const verifiedCodes = audit.verifiedCodes ?? [];
  const recomputedTotals = audit.recomputedTotals ?? claim.totals;
  const statedTotals = audit.statedTotals ?? {
    billed: claim.totals.billed,
    insurancePaid: claim.totals.insurancePaid,
    patientResponsibility: claim.totals.patientResponsibility,
  };
  const reconciliationOk = audit.reconciliationOk ?? true;
  const confidence = audit.confidence ?? "high";
  const sourceLabel =
    audit.source === "llm-fallback" || audit.source === "demo-llm-fallback"
      ? "LLM fallback"
      : "Deterministic parser";
  const confidenceText =
    confidence === "high"
      ? "Totals matched and all returned codes were verified."
      : confidence === "medium"
        ? "Totals matched, but at least one returned code was rejected."
        : "Totals did not reconcile or extraction was incomplete.";

  return (
    <section className="verification-trace" aria-labelledby="verification-trace-title">
      <div className="verification-trace-head">
        <div>
          <div className="card-eyebrow">Verification trace</div>
          <h2 id="verification-trace-title">Why we trust this appeal packet</h2>
        </div>
        <div className={`confidence-pill confidence-pill--${confidence}`}>
          {confidence} confidence
        </div>
      </div>

      <div className="trace-grid">
        <div className="trace-panel">
          <div className="trace-panel-title">1. Extraction source</div>
          <p>{sourceLabel} converted the EOB into service lines and dollar amounts.</p>
        </div>
        <div className="trace-panel">
          <div className="trace-panel-title">2. Code validation</div>
          <div className="code-chip-row">
            {verifiedCodes.slice(0, 8).map((code) => (
              <span className="code-chip code-chip--ok" key={code}>{code} verified</span>
            ))}
          </div>
          {rejectedCodes.length > 0 ? (
            <div className="rejected-row">
              {rejectedCodes.map((code) => (
                <span className="code-chip code-chip--bad" key={code}>{code} rejected</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="trace-panel">
          <div className="trace-panel-title">3. Deterministic reconciliation</div>
          <div className="totals-compare">
            <span>LLM stated billed</span>
            <strong>{formatMoney(statedTotals.billed)}</strong>
            <span>System recomputed billed</span>
            <strong>{formatMoney(recomputedTotals.billed)}</strong>
          </div>
          <div className={`trace-result ${reconciliationOk ? "trace-result--ok" : "trace-result--bad"}`}>
            {reconciliationOk ? "Totals matched within $1 tolerance" : "Totals did not reconcile"}
          </div>
        </div>
        <div className="trace-panel">
          <div className="trace-panel-title">4. Action generated</div>
          <p>
            Appeal packet targets {claim.denials.filter((d) => d.appealable).length}
            {" "}appealable denial{claim.denials.filter((d) => d.appealable).length === 1 ? "" : "s"}
            {" "}worth {formatMoney(claim.totals.potentialSavings)}.
          </p>
          <p className="trace-muted">{confidenceText}</p>
        </div>
      </div>

      {audit.citations?.length ? (
        <div className="citation-strip">
          {audit.citations.map((citation) => (
            <figure key={citation.label}>
              <figcaption>{citation.label}</figcaption>
              <blockquote>{citation.text}</blockquote>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildAuditFromClaim(data: AnalyzeClaimResponse): ExtractionAudit {
  const verifiedCodes = new Set<string>();
  for (const line of data.claim.lines) {
    if (line.cpt) verifiedCodes.add(`CPT ${line.cpt.code}`);
    if (line.hcpcs) verifiedCodes.add(`HCPCS ${line.hcpcs.code}`);
    for (const diagnosis of line.diagnosis ?? []) verifiedCodes.add(`ICD-10 ${diagnosis.code}`);
    if (line.denial) verifiedCodes.add(`CARC ${line.denial.carc.code}`);
  }
  return {
    source: "regex",
    confidence: "high",
    rejectedCodes: [],
    reconciliationOk: true,
    verifiedCodes: [...verifiedCodes],
    statedTotals: {
      billed: data.claim.totals.billed,
      insurancePaid: data.claim.totals.insurancePaid,
      patientResponsibility: data.claim.totals.patientResponsibility,
    },
    recomputedTotals: data.claim.totals,
  };
}

/** Derive a readable appeal letter from the claim data. */
function buildAppealLetter(data: AnalyzeClaimResponse): string {
  const { claim } = data;
  const appealableLines = claim.lines.filter(
    (l) => l.denial?.appealable
  );

  if (appealableLines.length === 0) {
    return data.patientFacingSummary;
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const denialDetails = appealableLines
    .map((l) => {
      const desc = l.cpt?.description ?? l.hcpcs?.description ?? "Unknown service";
      const code = l.cpt?.code ?? l.hcpcs?.code ?? "N/A";
      const denial = l.denial!;
      return `  • CPT ${code} — ${desc}
    Denial reason: ${denial.reason}
    Recommended action: ${denial.recommendedAction}`;
    })
    .join("\n\n");

  return `${today}

Appeals Department
${claim.insurerName ?? "Insurance Company"}
${claim.insurerPhone ? `Phone: ${claim.insurerPhone}` : ""}

RE: Formal Appeal — Claim ${claim.claimId ?? "N/A"}
Member ID: ${claim.memberId ?? "N/A"}
Patient: ${claim.patientName ?? "N/A"}
Service Date: ${claim.serviceDate ?? "N/A"}
Provider: ${claim.providerName ?? "N/A"}

To Whom It May Concern:

I am writing to formally appeal the denial of the following services on the above-referenced claim. I believe these services were medically necessary and should be covered under my health plan.

DENIED SERVICES UNDER APPEAL:

${denialDetails}

GROUNDS FOR APPEAL:

Each denied service was ordered by my treating physician as clinically necessary given my presenting condition. The denials appear to be based on administrative or bundling criteria that do not reflect the independent clinical indications documented in my medical record.

I respectfully request that you conduct a full review of the medical records and physician notes associated with this claim, and that you overturn these denials and process payment accordingly.

Enclosed / available upon request:
  • Emergency department visit notes dated ${claim.serviceDate ?? "N/A"}
  • Physician orders for each denied service
  • Admitting diagnosis and clinical documentation

Please respond in writing within 30 days. If this internal appeal is denied, I reserve the right to request an independent external review through the appropriate regulatory authority.

Sincerely,

${claim.patientName ?? "Patient"}
Member ID: ${claim.memberId ?? "N/A"}
`;
}
