"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeClaimResponse } from "@/lib/types/claim";
import { ClaimResults } from "@/components/claim/ClaimResults";

// Backend may include appealLetter as an extra key beyond the typed shape.
type ClaimResponseWithLetter = AnalyzeClaimResponse & { appealLetter?: string };

type Phase = "idle" | "uploading" | "scanning" | "results";

const ACCEPTED_MIME = ["application/pdf", "text/plain"];
const ACCEPTED_INPUT = ".pdf,.txt,application/pdf,text/plain";
const MAX_BYTES = 25 * 1024 * 1024;

const SCAN_LABELS = [
  "Reading your EOB…",
  "Decoding CPT and CARC codes…",
  "Identifying appealable denials…",
  "Calculating potential savings…",
];

export default function ClaimPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ClaimResponseWithLetter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanIdx, setScanIdx] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scan label rotation
  useEffect(() => {
    if (phase !== "scanning") return;
    const id = window.setInterval(
      () => setScanIdx((i) => (i + 1) % SCAN_LABELS.length),
      1200
    );
    return () => window.clearInterval(id);
  }, [phase]);

  // Demo mode: ?demo=eob
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "eob") return;

    let cancelled = false;
    setError(null);

    async function loadDemo() {
      try {
        const res = await fetch("/demo/eob.json");
        if (res.ok) {
          const body = (await res.json()) as AnalyzeClaimResponse;
          if (!cancelled) {
            setResult(body);
            setPhase("results");
          }
          return;
        }
      } catch {
        // fall through to error
      }
      if (!cancelled) {
        setError("Could not load demo data.");
      }
    }

    loadDemo();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_MIME.includes(file.type) && !file.name.endsWith(".txt")) {
      setError("Please upload a PDF or text file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be under 25 MB.");
      return;
    }

    setError(null);
    setProgress(0);
    setPhase("uploading");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/analyze-claim");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress((e.loaded / e.total) * 100);
    });

    xhr.upload.addEventListener("load", () => {
      setProgress(100);
      setPhase("scanning");
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as AnalyzeClaimResponse;
          setResult(body);
          setPhase("results");
        } catch {
          setError("Could not parse the analysis response.");
          setPhase("idle");
        }
      } else {
        let message = "Analysis failed. Please try again.";
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          /* ignore */
        }
        setError(message);
        setPhase("idle");
      }
    });

    xhr.addEventListener("error", () => {
      setError("Network error while uploading. Please try again.");
      setPhase("idle");
    });

    xhr.send(formData);
  }, []);

  // ── Idle: dropzone ──────────────────────────────────────────────────────────
  if (phase === "idle" || (phase !== "uploading" && phase !== "scanning" && phase !== "results")) {
    return (
      <>
        <div className="hero">
          <h1>Fight your medical bill</h1>
          <p>
            Drop your Explanation of Benefits (EOB) and we&apos;ll decode every
            denial, calculate your savings, and draft your appeal letter.
          </p>
        </div>

        <div
          className={`dropzone${dragActive ? " is-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <div className="dropzone-icon" aria-hidden="true">↑</div>
          <div className="dropzone-title">Drop your EOB here</div>
          <div className="dropzone-sub">
            or <span className="browse-link">browse your files</span>
          </div>
          <div className="dropzone-types">Accepts PDF or TXT · up to 25 MB</div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_INPUT}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {error ? (
          <div className="error-row">
            {error}
            <button
              type="button"
              style={{ marginLeft: 12, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit" }}
              onClick={() => {
                window.location.href = "/?demo=eob";
              }}
            >
              Load demo instead
            </button>
          </div>
        ) : null}

        <div className="sample-row">
          Want to see a demo?
          <button
            type="button"
            onClick={() => {
              window.location.href = "/?demo=eob";
            }}
          >
            Load sample EOB
          </button>
        </div>

        <div className="privacy-row">
          Your file is sent securely and is not stored after analysis.
        </div>
      </>
    );
  }

  // ── Uploading ───────────────────────────────────────────────────────────────
  if (phase === "uploading") {
    const pct = Math.min(100, Math.max(0, Math.round(progress)));
    return (
      <div className="upload-card">
        <div className="upload-file">
          <div className="file-icon" aria-hidden="true">PDF</div>
          <div className="file-meta">
            <div className="file-name">Uploading your EOB…</div>
          </div>
        </div>
        <div className="progress" aria-label="Upload progress">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="upload-status">
          <span>Uploading…</span>
          <span>{pct}%</span>
        </div>
      </div>
    );
  }

  // ── Scanning ────────────────────────────────────────────────────────────────
  if (phase === "scanning") {
    return (
      <div className="scan-card" role="status" aria-live="polite">
        <div className="scan-title">Analyzing your claim</div>
        <div className="scan-sub">
          We&apos;re decoding the insurance codes and identifying opportunities to appeal.
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
          <div className="scan-glow" />
          <div className="scan-line" />
        </div>
        <div className="scan-status">{SCAN_LABELS[scanIdx]}</div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    return <ClaimResults data={result} onReset={handleReset} />;
  }

  return null;
}
