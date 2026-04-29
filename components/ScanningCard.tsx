"use client";

import { useEffect, useState } from "react";

const STATUS_LABELS = [
  "Reading the document…",
  "Identifying clauses…",
  "Flagging concerning language…",
  "Drafting plain-English summary…",
];

export function ScanningCard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % STATUS_LABELS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="scan-card" role="status" aria-live="polite">
      <div className="scan-title">Reading your document</div>
      <div className="scan-sub">
        Claude is reviewing the consent form page by page.
      </div>

      <div className="scan-frame" aria-hidden="true">
        <div className="doc-line h" />
        <div className="doc-line" />
        <div className="doc-line medium" />
        <div className="doc-line" />
        <div className="doc-line short" />
        <div className="doc-line h" />
        <div className="doc-line" />
        <div className="doc-line medium" />
        <div className="doc-line" />
        <div className="doc-line short" />
        <div className="doc-line medium" />
        <div className="doc-line" />
        <div className="doc-line short" />
        <div className="scan-glow" />
        <div className="scan-line" />
      </div>

      <div className="scan-status">{STATUS_LABELS[idx]}</div>
    </div>
  );
}
