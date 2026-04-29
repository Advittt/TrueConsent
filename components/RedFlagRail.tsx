"use client";

import type { RedFlag } from "@/lib/types";

interface RedFlagRailProps {
  flags: RedFlag[];
  onSelect: (id: string) => void;
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
