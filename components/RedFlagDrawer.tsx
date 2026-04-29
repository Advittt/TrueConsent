"use client";

import { useEffect } from "react";
import type { RedFlag, VerifiedRedFlag } from "@/lib/types";

interface RedFlagDrawerProps {
  flag: RedFlag | VerifiedRedFlag | null;
  onClose: () => void;
}

function verificationLine(f: RedFlag | VerifiedRedFlag) {
  if (!("verification" in f)) return null;
  if (f.verification === "verified")
    return (
      <div className="verify-line ok">
        ✓ Verbatim quote located in your document
        {typeof f.matchOffset === "number"
          ? ` (char ${f.matchOffset.toLocaleString()})`
          : ""}
      </div>
    );
  if (f.verification === "fuzzy")
    return (
      <div className="verify-line warn">
        ~ Fuzzy match — {Math.round((f.matchScore ?? 0) * 100)}% of quote tokens
        appear in the form. Wording may have been paraphrased by the model.
      </div>
    );
  if (f.verification === "unverified")
    return (
      <div className="verify-line bad">
        ! Quote not found in your document — review carefully before relying on
        this flag.
      </div>
    );
  if (f.verification === "n/a")
    return (
      <div className="verify-line muted">
        Verification unavailable for this file type (text extraction skipped).
      </div>
    );
  return null;
}

export function RedFlagDrawer({ flag, onClose }: RedFlagDrawerProps) {
  const open = flag !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-backdrop${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`drawer${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        aria-hidden={!open}
      >
        {flag ? (
          <>
            <div className="drawer-header">
              <div>
                <span className={`drawer-tag ${flag.severity}`}>
                  {flag.severity}
                </span>
                <div className="drawer-title" id="drawer-title">
                  {flag.title}
                </div>
              </div>
              <button
                type="button"
                className="drawer-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="drawer-body">
              <section className="drawer-section">
                <div className="drawer-section-title">Why this is flagged</div>
                <p>{flag.why}</p>
              </section>

              {flag.quote ? (
                <section className="drawer-section">
                  <div className="drawer-section-title">From the form</div>
                  <blockquote className="drawer-quote">
                    &ldquo;{flag.quote}&rdquo;
                  </blockquote>
                </section>
              ) : null}

              {flag.ask ? (
                <section className="drawer-section">
                  <div className="drawer-section-title">Worth asking</div>
                  <p>{flag.ask}</p>
                </section>
              ) : null}

              <section className="drawer-section">
                <div className="drawer-section-title">Source verification</div>
                {verificationLine(flag)}
              </section>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
