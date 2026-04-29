"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { RedFlagRail } from "./RedFlagRail";
import { RedFlagDrawer } from "./RedFlagDrawer";

interface ResultsProps {
  analysis: Analysis;
  fileName: string;
  durationMs: number;
  onReset: () => void;
}

export function Results({
  analysis,
  fileName,
  durationMs,
  onReset,
}: ResultsProps) {
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const selectedFlag =
    analysis.redFlags.find((f) => f.id === selectedFlagId) ?? null;

  return (
    <>
      <div className="results-header">
        <div className="results-meta">
          <span className="results-file">{fileName}</span>
          <span className="results-time">
            analyzed in {formatDuration(durationMs)}
          </span>
          <span className="results-pill">Done</span>
        </div>
        <div className="results-actions">
          <button type="button" onClick={onReset}>
            Upload another
          </button>
        </div>
      </div>

      <div className="results-grid">
        <div className="narrative">
          <section className="card" aria-labelledby="summary-h">
            <div className="card-eyebrow">Plain-English summary</div>
            <h2 id="summary-h">What this form is</h2>
            <p>{analysis.summary}</p>
          </section>

          <section className="card" aria-labelledby="agreements-h">
            <div className="card-eyebrow">What you&apos;re agreeing to</div>
            <h2 id="agreements-h">By signing, you grant</h2>
            {analysis.agreements.length > 0 ? (
              <ul>
                {analysis.agreements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No specific permissions were extracted from the form.</p>
            )}
          </section>

          <section className="card" aria-labelledby="risks-h">
            <div className="card-eyebrow">Key risks the form discloses</div>
            <h2 id="risks-h">Risks named in the document</h2>
            {analysis.risks.length > 0 ? (
              <ul>
                {analysis.risks.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>The form does not enumerate specific medical risks.</p>
            )}
          </section>

          <section className="card" aria-labelledby="questions-h">
            <div className="card-eyebrow">Questions to ask your doctor</div>
            <h2 id="questions-h">Before you sign, consider asking</h2>
            {analysis.doctorQuestions.length > 0 ? (
              <ul>
                {analysis.doctorQuestions.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>No suggested questions were generated for this form.</p>
            )}
          </section>
        </div>

        <RedFlagRail
          flags={analysis.redFlags}
          onSelect={setSelectedFlagId}
        />
      </div>

      <RedFlagDrawer
        flag={selectedFlag}
        onClose={() => setSelectedFlagId(null)}
      />
    </>
  );
}
