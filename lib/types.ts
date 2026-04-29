export type Severity = "high" | "medium" | "low";

export interface RedFlag {
  id: string;
  severity: Severity;
  title: string;
  why: string;
  quote: string;
  ask: string;
}

export interface Analysis {
  summary: string;
  agreements: string[];
  risks: string[];
  redFlags: RedFlag[];
  doctorQuestions: string[];
}

export interface AnalyzeResponse {
  analysis: Analysis;
  fileName: string;
  fileSize: number;
  durationMs: number;
}
