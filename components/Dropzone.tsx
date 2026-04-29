"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const ACCEPTED_INPUT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*";
const MAX_BYTES = 25 * 1024 * 1024;

interface DropzoneProps {
  onFile: (file: File) => void;
}

export function Dropzone({ onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined | null) => {
      if (!file) return;
      if (!ACCEPTED_MIME.includes(file.type)) {
        setError(
          "Unsupported file type. Upload a PDF or image (PNG, JPG, WEBP, GIF)."
        );
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File is larger than 25 MB.");
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile]
  );

  return (
    <>
      <div className="hero">
        <h1>Upload your medical consent form</h1>
        <p>
          We&apos;ll explain it in plain English and flag anything that
          deserves a closer look.
        </p>
      </div>

      <div
        className={`dropzone${active ? " is-active" : ""}`}
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
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="dropzone-icon" aria-hidden="true">
          ↑
        </div>
        <div className="dropzone-title">Drop a PDF or image here</div>
        <div className="dropzone-sub">
          or <span className="browse-link">browse your files</span>
        </div>
        <div className="dropzone-types">
          Accepts PDF, JPG, PNG, WEBP, GIF · up to 25 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_INPUT}
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error ? <div className="error-row">{error}</div> : null}

      <div className="privacy-row">
        Your file is sent securely to Anthropic&apos;s Claude model for
        analysis and is not stored after the session ends.
      </div>
    </>
  );
}
