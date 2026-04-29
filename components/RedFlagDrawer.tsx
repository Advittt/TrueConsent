"use client";

import { useEffect } from "react";
import type { RedFlag } from "@/lib/types";

interface RedFlagDrawerProps {
  flag: RedFlag | null;
  onClose: () => void;
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
                <div className="drawer-section-title">
                  Compare alternative locations
                </div>
                <div className="map-placeholder">
                  <div className="map-icon" aria-hidden="true">
                    🗺
                  </div>
                  <div className="map-title">
                    Find clinics that resolve this concern
                  </div>
                  <p style={{ fontSize: 13, marginTop: 4 }}>
                    See nearby providers whose forms don&apos;t include this
                    clause — or that offer additional protections.
                  </p>
                  <span className="map-soon">Coming soon</span>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
