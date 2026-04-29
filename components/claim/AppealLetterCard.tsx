"use client";

import { useState } from "react";

interface AppealLetterCardProps {
  letter: string;
}

export function AppealLetterCard({ letter }: AppealLetterCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "appeal-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <div className="card-eyebrow">Generated appeal</div>
      <div className="appeal-header">
        <h2 style={{ fontSize: 18, marginBottom: 0 }}>Ready-to-send appeal letter</h2>
        <div className="appeal-actions">
          <button type="button" className="appeal-btn" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy letter"}
          </button>
          <button type="button" className="appeal-btn appeal-btn--primary" onClick={handleDownload}>
            Download .txt
          </button>
        </div>
      </div>
      <pre className="appeal-letter">{letter}</pre>
    </div>
  );
}
