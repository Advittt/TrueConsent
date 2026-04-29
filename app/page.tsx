"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeClaimResponse } from "@/lib/types/claim";
import { ClaimResults } from "@/components/claim/ClaimResults";

// Backend may include appealLetter as an extra key beyond the typed shape.
type ClaimResponseWithLetter = AnalyzeClaimResponse & { appealLetter?: string };

type Phase = "idle" | "uploading" | "scanning" | "results";
type DemoExample = {
  id: string;
  label: string;
  path: string;
  summary: string;
  expectedMethod: "regex" | "llm" | "failed";
};

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
  const [demoExamples, setDemoExamples] = useState<DemoExample[]>([]);
  const [demoLoadingId, setDemoLoadingId] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    fetch("/demo/eob-examples/index.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((examples: DemoExample[]) => {
        if (!cancelled) setDemoExamples(examples);
      })
      .catch(() => {
        if (!cancelled) setDemoExamples([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Demo mode: ?demo=eob or ?demo=surgery
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    const DEMO_FILES: Record<string, string> = {
      eob: "/demo/eob.json",
      surgery: "/demo/surgery.json",
    };
    const path = demo ? DEMO_FILES[demo] : null;
    if (!path) return;

    let cancelled = false;
    setError(null);

    async function loadDemo() {
      try {
        const res = await fetch(path!);
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

  const CACHED_DEMOS: { key: string; label: string; path: string }[] = [
    { key: "eob",     label: "ER visit — CO-50 denial",  path: "/demo/eob.json" },
    { key: "surgery", label: "Surgery — multiple denials", path: "/demo/surgery.json" },
  ];

  const [activeDemoKey, setActiveDemoKey] = useState<string | null>(null);

  const loadCachedDemo = useCallback(async (key: string, path: string) => {
    setError(null);
    setActiveDemoKey(key);
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error();
      const body = (await res.json()) as ClaimResponseWithLetter;
      setResult(body);
      setPhase("results");
    } catch {
      setError("Could not load demo.");
      setActiveDemoKey(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setResult(null);
    setError(null);
    setActiveDemoKey(null);
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
      setDemoLoadingId(null);
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
      setDemoLoadingId(null);
      setError("Network error while uploading. Please try again.");
      setPhase("idle");
    });

    xhr.send(formData);
  }, []);

  const handleDemoExample = useCallback(
    async (example: DemoExample) => {
      setError(null);
      setDemoLoadingId(example.id);
      try {
        const res = await fetch(example.path);
        if (!res.ok) throw new Error("Demo example could not be loaded.");
        const text = await res.text();
        const file = new File([text], `${example.id}.txt`, { type: "text/plain" });
        handleFile(file);
      } catch (err) {
        setDemoLoadingId(null);
        setPhase("idle");
        setError(err instanceof Error ? err.message : "Demo example could not be loaded.");
      }
    },
    [handleFile]
  );

  // ── Idle: dropzone ──────────────────────────────────────────────────────────
  if (phase === "idle" || (phase !== "uploading" && phase !== "scanning" && phase !== "results")) {
    return (
      <>
        <section className="claim-landing">
          <div className="claim-landing-copy">
            <div className="landing-kicker">Medical bill recovery</div>
            <h1>Turn denied claims into verified appeal packets.</h1>
            <p>
              TrueConsent reads messy EOBs, rejects hallucinated codes, reconciles
              the math, and builds the appeal package needed to recover money.
            </p>
            <div className="landing-actions">
              {CACHED_DEMOS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="landing-primary"
                  onClick={() => loadCachedDemo(d.key, d.path)}
                >
                  {d.label}
                </button>
              ))}
              <button
                type="button"
                className="landing-secondary"
                onClick={() => inputRef.current?.click()}
              >
                Upload EOB
              </button>
            </div>
            <div className="landing-proof">
              <span>Code validation</span>
              <span>Total reconciliation</span>
              <span>Success-fee model</span>
            </div>
          </div>

          <div
            className={`dropzone landing-dropzone${dragActive ? " is-active" : ""}`}
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
            <div className="dropzone-title">Analyze your EOB</div>
            <div className="dropzone-sub">
              Drop a PDF/TXT or <span className="browse-link">browse files</span>
            </div>
            <div className="dropzone-types">Private processing · up to 25 MB</div>
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
        </section>

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

        <div className="landing-workflow">
          <div>
            <strong>1. Extract</strong>
            <span>LLM reads insurer layouts that regex parsers miss.</span>
          </div>
          <div>
            <strong>2. Verify</strong>
            <span>CPT, HCPCS, ICD-10, and CARC codes must match local tables.</span>
          </div>
          <div>
            <strong>3. Recover</strong>
            <span>Appeal letters and call workflows target only verified savings.</span>
          </div>
        </div>

        <section className="demo-examples" aria-labelledby="demo-examples-title">
          <div className="demo-examples-head">
            <div>
              <div className="card-eyebrow">Demo set</div>
              <h2 id="demo-examples-title">Run insurer formats through the full pipeline</h2>
            </div>
            <button
              type="button"
              className="demo-link-btn"
              onClick={() => {
                window.location.href = "/?demo=eob";
              }}
            >
              Open fallback walkthrough
            </button>
          </div>

          <div className="demo-grid">
            {demoExamples.map((example) => (
              <button
                type="button"
                className="demo-card"
                key={example.id}
                onClick={() => handleDemoExample(example)}
                disabled={demoLoadingId !== null}
              >
                <span className={`demo-method demo-method--${example.expectedMethod}`}>
                  {example.expectedMethod}
                </span>
                <strong>{example.label}</strong>
                <span>{example.summary}</span>
                <span className="demo-card-action">
                  {demoLoadingId === example.id ? "Loading..." : "Analyze example"}
                </span>
              </button>
            ))}
          </div>
        </section>

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
    return (
      <>
        <div className="demo-switcher">
          {CACHED_DEMOS.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`demo-switcher-btn${activeDemoKey === d.key ? " demo-switcher-btn--active" : ""}`}
              onClick={() => loadCachedDemo(d.key, d.path)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <ClaimResults data={result} onReset={handleReset} />
      </>
    );
  }

  return null;
}
