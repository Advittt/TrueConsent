"use client";

import type { RedFlag, VerifiedRedFlag } from "@/lib/types";

interface RedFlagRailProps {
  flags: (RedFlag | VerifiedRedFlag)[];
  onSelect: (id: string) => void;
}

function verificationBadge(f: RedFlag | VerifiedRedFlag) {
  if (!("verification" in f)) return null;
  if (f.verification === "verified")
    return <span className="verify-badge ok" title="Verbatim quote found in document">✓ verbatim</span>;
  if (f.verification === "fuzzy")
    return <span className="verify-badge warn" title={`Fuzzy match (${Math.round((f.matchScore ?? 0) * 100)}%)`}>~ fuzzy</span>;
  if (f.verification === "unverified")
    return <span className="verify-badge bad" title="Quote not found in document">! unverified</span>;
  return null;
}

export function RedFlagRail({ flags, onSelect }: RedFlagRailProps) {
  if (flags.length === 0) {
    return (
      <aside className="flags-card" aria-label="Red flags">
        <div className="flags-header">
          <div className="flags-title">⚑ Red flags</div>
          <div className="flags-count" style={{ background: "#dcfce7", color: "#166534" }}>
            0
          </div>
        </div>
        <div style={{ padding: "18px", fontSize: 14, color: "var(--muted)" }}>
          No clauses were flagged for closer review.
        </div>
      </aside>
    );
  }

  return (
    <aside className="flags-card" aria-label="Red flags">
      <div className="flags-header">
        <div className="flags-title">⚑ Red flags</div>
        <div className="flags-count">{flags.length}</div>
      </div>
      {flags.map((flag) => (
        <button
          key={flag.id}
          type="button"
          className="flag"
          onClick={() => onSelect(flag.id)}
          aria-label={`Open details for ${flag.title}`}
        >
          <div className="flag-row">
            <div>
              <span className={`flag-severity ${flag.severity}`}>
                {flag.severity}
              </span>
              <span className="flag-title">{flag.title}</span>
              {verificationBadge(flag)}
            </div>
            <div className="flag-chev" aria-hidden="true">
              ›
            </div>
          </div>
          <div className="flag-sub">{flag.why}</div>
        </button>
      ))}
    </aside>
  );
}
