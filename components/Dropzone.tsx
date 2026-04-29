"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const ACCEPTED_INPUT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*";
const CAMERA_INPUT = "image/*";
const MAX_BYTES = 25 * 1024 * 1024;

interface DropzoneProps {
  onFile: (file: File) => void;
}

export function Dropzone({ onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraCapable, setCameraCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const touchCapable =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setCameraCapable(coarsePointer || touchCapable);
  }, []);

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
        <div className="dropzone-title">
          {cameraCapable
            ? "Drop, browse, or snap a photo"
            : "Drop a PDF or image here"}
        </div>
        <div className="dropzone-sub">
          or <span className="browse-link">browse your files</span>
          {cameraCapable ? (
            <>
              {" "}
              ·{" "}
              <button
                type="button"
                className="browse-link camera-link"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                use your camera
              </button>
            </>
          ) : null}
        </div>
        <div className="dropzone-types">
          Accepts PDF, JPG, PNG, WEBP, GIF · up to 25 MB
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_INPUT}
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {cameraCapable ? (
          <input
            ref={cameraInputRef}
            type="file"
            accept={CAMERA_INPUT}
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        ) : null}
      </div>

      {error ? <div className="error-row">{error}</div> : null}

      <div className="privacy-row">
        Your file is sent securely to Claude (routed via TokenRouter) for
        analysis and is not stored after the session ends.
      </div>
    </>
  );
}
