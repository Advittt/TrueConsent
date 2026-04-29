export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKindLabel(file: { type: string; name: string }): string {
  if (file.type === "application/pdf") return "PDF";
  if (file.type.startsWith("image/")) {
    const ext = file.name.split(".").pop();
    return (ext || "IMG").slice(0, 4).toUpperCase();
  }
  return "FILE";
}

export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
