import type { Analysis, DeterministicChecks } from "@/lib/types";
import { extractPdfText } from "./extractText";
import { verifyQuotes } from "./quoteVerification";
import { detectModality } from "./modality";
import { findPatternHits } from "./patterns";
import { checkRequiredElements } from "./requiredElements";
import { classifyAll } from "./taxonomy";

export async function runDeterministicChecks(
  buffer: Buffer,
  mediaType: string,
  analysis: Analysis
): Promise<DeterministicChecks> {
  const text =
    mediaType === "application/pdf" ? await extractPdfText(buffer) : null;

  const modality = detectModality(text);
  const patternHits = findPatternHits(text);
  const requiredElements = checkRequiredElements(text);
  const redFlagsVerified = verifyQuotes(text, analysis.redFlags);
  const taxonomy = classifyAll(analysis.redFlags);

  const verifiedCount = redFlagsVerified.filter(
    (f) => f.verification === "verified"
  ).length;
  const fuzzyCount = redFlagsVerified.filter(
    (f) => f.verification === "fuzzy"
  ).length;
  const totalFlags = redFlagsVerified.length || 1;
  const requiredScore =
    requiredElements.filter((e) => e.present).length / requiredElements.length;
  const verificationScore =
    (verifiedCount + fuzzyCount * 0.5) / totalFlags;

  // Trust score: weighted combo of how grounded the redflags are and how
  // structurally complete the form is. Range 0–100.
  const trustScore = Math.round(
    (verificationScore * 0.7 + requiredScore * 0.3) * 100
  );

  return {
    textExtracted: text !== null,
    textLength: text?.length ?? 0,
    modality,
    patternHits,
    requiredElements,
    redFlagsVerified,
    taxonomy,
    trustScore,
  };
}
