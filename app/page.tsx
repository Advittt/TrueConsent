"use client";

import { useCallback, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { UploadingCard } from "@/components/UploadingCard";
import { ScanningCard } from "@/components/ScanningCard";
import { Results } from "@/components/Results";
import { fileKindLabel } from "@/lib/format";
import type { AnalyzeResponse } from "@/lib/types";

type Phase = "idle" | "uploading" | "scanning" | "results";

interface PendingFile {
  name: string;
  size: number;
  kind: string;
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setPhase("idle");
    setPending(null);
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setProgress(0);
    setPending({
      name: file.name,
      size: file.size,
      kind: fileKindLabel(file),
    });
    setPhase("uploading");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/analyze");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress((event.loaded / event.total) * 100);
      }
    });

    xhr.upload.addEventListener("load", () => {
      setProgress(100);
      setPhase("scanning");
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText) as AnalyzeResponse;
          setResult(body);
          setPhase("results");
        } catch {
          setError("Could not parse the analysis response.");
          setPhase("idle");
        }
      } else {
        let message = "The analysis failed. Please try again.";
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

  if (phase === "idle") {
    return (
      <>
        <Dropzone onFile={handleFile} />
        {error ? <div className="error-row">{error}</div> : null}
      </>
    );
  }

  if (phase === "uploading" && pending) {
    return (
      <UploadingCard
        fileName={pending.name}
        fileSize={pending.size}
        fileKind={pending.kind}
        progress={progress}
      />
    );
  }

  if (phase === "scanning") {
    return <ScanningCard />;
  }

  if (phase === "results" && result) {
    return (
      <Results
        analysis={result.analysis}
        fileName={result.fileName}
        durationMs={result.durationMs}
        onReset={handleReset}
      />
    );
  }

  return null;
}
