import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text =
      result.text ||
      (result.pages ? result.pages.map((p) => p.text).join("\n") : "");
    return text || null;
  } catch {
    return null;
  }
}

export function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").toLowerCase().trim();
}
