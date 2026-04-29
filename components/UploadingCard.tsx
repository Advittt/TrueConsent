"use client";

import { formatFileSize } from "@/lib/format";

interface UploadingCardProps {
  fileName: string;
  fileSize: number;
  fileKind: string;
  progress: number;
}

export function UploadingCard({
  fileName,
  fileSize,
  fileKind,
  progress,
}: UploadingCardProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <div className="upload-card" role="status" aria-live="polite">
      <div className="upload-file">
        <div className="file-icon" aria-hidden="true">
          {fileKind}
        </div>
        <div className="file-meta">
          <div className="file-name">{fileName}</div>
          <div className="file-size">{formatFileSize(fileSize)}</div>
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
