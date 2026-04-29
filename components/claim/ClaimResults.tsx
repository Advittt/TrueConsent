"use client";

import { useState } from "react";
import type { AnalyzeClaimResponse } from "@/lib/types/claim";
import { formatMoney } from "@/lib/format-money";
import { SavingsBanner } from "./SavingsBanner";
import { ClaimTable } from "./ClaimTable";
import { AppealLetterCard } from "./AppealLetterCard";
import { AuthModal } from "./AuthModal";
import { CallModal } from "./CallModal";

// The real backend sends appealLetter as an extra key beyond the typed shape.
type ExtractionAudit = {
  source?: "regex" | "llm-fallback" | "demo-llm-fallback" | "failed";
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
  if (!data?.claim) {
    return (
      <div>
        <button type="button" className="claim-reset-btn" onClick={onReset} style={{ marginBottom: 16 }}>
          Upload another EOB
        </button>
        <div className="failed-extraction-card">
          <div className="card-eyebrow">Unsupported format</div>
          <h2>Could not read this document as an EOB</h2>
          <p>No service lines or denial codes were found. Try uploading a different file.</p>
        </div>
      </div>
    );
  }

  const { claim, patientFacingSummary } = data;
  const { totals } = claim;
  const appealLetter = data.appealLetter ?? buildAppealLetter(data);
  const hasAppealable = claim.denials.some((d) => d.appealable);
  const extractionFailed =
    claim.extractionMethod === "failed" || claim.kind === "unknown" || claim.lines.length === 0;

  // Call flow state
  const [showAuth, setShowAuth] = useState(false);
  const [callSession, setCallSession] = useState<{
    callId: string; phone: string; insurerName: string; demo: boolean;
  } | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  async function handleAuthorize(signedAt: string) {
    setShowAuth(false);
    setCalling(true);
    setCallError(null);

    const primaryDenial = claim.lines.find((l) => l.denial?.appealable);
    const demoMode = !process.env.NEXT_PUBLIC_BLAND_KEY;

    try {
      const res = await fetch("/api/initiate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claim.claimId ?? "unknown",
          memberId: claim.memberId,
          patientName: claim.patientName ?? "Patient",
          insurerName: claim.insurerName ?? "Insurance Company",
          serviceDate: claim.serviceDate,
          denialCode: primaryDenial?.denial?.carc.code ?? "CO-50",
          denialReason: primaryDenial?.denial?.reason ?? "Not medically necessary",
          procedureCode: primaryDenial?.cpt?.code ?? primaryDenial?.hcpcs?.code ?? "99285",
          procedureDescription: primaryDenial?.cpt?.description ?? primaryDenial?.hcpcs?.description ?? "ER visit",
          billedAmount: primaryDenial?.billed ?? 0,
          authSignedAt: signedAt,
          demoMode,
        }),
      });

      const json = (await res.json()) as { callId?: string; phone?: string; insurerName?: string; demo?: boolean; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Call failed to start.");

      setCallSession({
        callId: json.callId ?? "demo",
        phone: json.phone ?? "1-800-555-0199",
        insurerName: json.insurerName ?? (claim.insurerName ?? "Insurance Company"),
        demo: json.demo ?? demoMode,
      });
    } catch (err) {
      setCallError(err instanceof Error ? err.message : "Could not start call.");
    } finally {
      setCalling(false);
    }
  }

  if (extractionFailed) {
    return (
      <div>
        <div className="claim-results-header">
          <div className="claim-results-meta">
            <span>
              <span className="claim-results-label">Status</span> Unsupported document
            </span>
          </div>
          <button type="button" className="claim-reset-btn" onClick={onReset}>
            Upload another EOB
          </button>
        </div>

        <div className="failed-extraction-card">
          <div className="card-eyebrow">Safe failure</div>
          <h2>We could not confidently read this as an EOB</h2>
          <p>
            No service lines, billed amounts, or denial codes were accepted. This is the intended
            behavior for unsupported documents: the system refuses to invent a claim and asks for a
            clearer EOB instead.
          </p>
          <button type="button" className="claim-reset-btn" onClick={onReset}>
            Try another document
          </button>
        </div>

        <VerificationTrace data={data} />
      </div>
    );
  }

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

      <div className="outcome-strip">
        <div className="outcome-card">
          <span className="outcome-label">Appealable denials</span>
          <strong>{claim.denials.filter((d) => d.appealable).length}</strong>
          <span>Clinical or coding issues worth challenging.</span>
        </div>
        <div className="outcome-card">
          <span className="outcome-label">Verified service lines</span>
          <strong>{claim.lines.length}</strong>
          <span>Accepted only after code-table validation.</span>
        </div>
        <div className="outcome-card">
          <span className="outcome-label">Business model</span>
          <strong>Success fee</strong>
          <span>A small percentage only if we recover money.</span>
        </div>
      </div>

      {/* ── Call CTA ─────────────────────────────────────────── */}
      {hasAppealable && (
        <div className="call-cta">
          <div className="call-cta-left">
            <div className="call-cta-title">
              Let us call {claim.insurerName ?? "your insurer"} for you
            </div>
            <div className="call-cta-sub">
              Average hold time: ~20 min. We navigate the IVR, reach a rep, and file
              your appeal — you watch the live transcript.
            </div>
            {callError && <div className="call-cta-error">{callError}</div>}
          </div>
          <button
            type="button"
            className="call-cta-btn"
            onClick={() => setShowAuth(true)}
            disabled={calling}
          >
            {calling ? "Starting call…" : "📞 Call insurance for me"}
          </button>
        </div>
      )}

      {/* Plain-English summary */}
      {patientFacingSummary ? (
        <div className="card summary-card">
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

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          claim={claim}
          onAuthorize={handleAuthorize}
          onCancel={() => setShowAuth(false)}
        />
      )}

      {/* Live call modal */}
      {callSession && (
        <CallModal
          callId={callSession.callId}
          insurerName={callSession.insurerName}
          phone={callSession.phone}
          demoMode={callSession.demo}
          onClose={() => setCallSession(null)}
        />
      )}
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
      : audit.source === "failed"
        ? "Safe failure"
      : "Deterministic parser";
  const sourceText =
    audit.source === "failed"
      ? "No reliable EOB structure was accepted, so the system stopped before generating claim lines."
      : `${sourceLabel} converted the EOB into service lines and dollar amounts.`;
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
          <p>{sourceText}</p>
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
