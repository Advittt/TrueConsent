"use client";

import type { DeterministicChecks } from "@/lib/types";

interface VerificationPanelProps {
  checks: DeterministicChecks | null;
}

const MODALITY_LABELS: Record<string, string> = {
  surgery: "Surgery",
  imaging: "Imaging / Radiology",
  telehealth: "Telehealth",
  "dental-implant": "Dental implant",
  orthodontics: "Orthodontics",
  general: "General medical",
  unknown: "Unknown",
};

export function VerificationPanel({ checks }: VerificationPanelProps) {
  if (!checks) return null;

  const verified = checks.redFlagsVerified.filter(
    (f) => f.verification === "verified"
  ).length;
  const fuzzy = checks.redFlagsVerified.filter(
    (f) => f.verification === "fuzzy"
  ).length;
  const unverified = checks.redFlagsVerified.filter(
    (f) => f.verification === "unverified"
  ).length;

  const modalityLabel =
    MODALITY_LABELS[checks.modality.detected] ?? checks.modality.detected;

  return (
    <section className="card verification-card" aria-labelledby="verify-h">
      <div className="card-eyebrow">Deterministic checks</div>
      <h2 id="verify-h">Verified by rule engine</h2>

      <div className="trust-row">
        <div className="trust-score">
          <div className="trust-score-num">{checks.trustScore}</div>
          <div className="trust-score-label">Trust score</div>
        </div>
        <div className="trust-row-meta">
          <div>
            <strong>Modality detected:</strong> {modalityLabel}
            {checks.modality.confidence > 0 ? (
              <span className="muted">
                {" "}
                · {Math.round(checks.modality.confidence * 100)}% confident
              </span>
            ) : null}
          </div>
          <div className="muted">
            {checks.textExtracted
              ? `${checks.textLength.toLocaleString()} chars of text extracted from your document`
              : "Text extraction unavailable for this file type — image OCR not yet enabled"}
          </div>
        </div>
      </div>

      <div className="check-grid">
        <div className="check-block">
          <div className="check-block-title">Quote grounding</div>
          <div className="check-block-body">
            <span className="check-pill ok">{verified} verbatim</span>{" "}
            <span className="check-pill warn">{fuzzy} fuzzy</span>{" "}
            <span className="check-pill bad">{unverified} unverified</span>
          </div>
          <div className="muted">
            Each red-flag quote is matched against your document&apos;s
            extracted text.
          </div>
        </div>

        <div className="check-block">
          <div className="check-block-title">Required elements</div>
          <ul className="check-list">
            {checks.requiredElements.map((el) => (
              <li key={el.name} className={el.present ? "ok" : "bad"}>
                {el.present ? "✓" : "—"} {el.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {checks.patternHits.length > 0 ? (
        <div className="pattern-block">
          <div className="check-block-title">
            Rule-detected clauses ({checks.patternHits.length})
          </div>
          <ul className="pattern-list">
            {checks.patternHits.slice(0, 6).map((h, i) => (
              <li key={i} className={`pattern-item ${h.severity}`}>
                <div className="pattern-head">
                  <span className={`tag ${h.severity}`}>{h.severity}</span>
                  <span className="pattern-label">{h.label}</span>
                </div>
                <div className="pattern-excerpt">…{h.excerpt}…</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
