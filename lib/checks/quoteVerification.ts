import type { RedFlag, VerifiedRedFlag, Verification } from "@/lib/types";
import { normalizeText } from "./extractText";

const FUZZY_THRESHOLD = 0.7;

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function fuzzyScore(quote: string, formText: string): number {
  const qTokens = tokenize(quote);
  if (qTokens.length === 0) return 0;
  const formTokenSet = new Set(tokenize(formText));
  const hits = qTokens.filter((t) => formTokenSet.has(t)).length;
  return hits / qTokens.length;
}

export function verifyQuotes(
  formText: string | null,
  flags: RedFlag[]
): VerifiedRedFlag[] {
  if (!formText) {
    return flags.map((f) => ({ ...f, verification: "n/a" as Verification }));
  }

  const normForm = normalizeText(formText);

  return flags.map((flag) => {
    const quote = (flag.quote ?? "").trim();
    if (!quote) {
      return { ...flag, verification: "unverified" as Verification };
    }

    const normQuote = normalizeText(quote);
    const offset = normForm.indexOf(normQuote);
    if (offset !== -1) {
      return {
        ...flag,
        verification: "verified" as Verification,
        matchScore: 1,
        matchOffset: offset,
      };
    }

    const score = fuzzyScore(quote, formText);
    if (score >= FUZZY_THRESHOLD) {
      return {
        ...flag,
        verification: "fuzzy" as Verification,
        matchScore: Number(score.toFixed(2)),
      };
    }

    return {
      ...flag,
      verification: "unverified" as Verification,
      matchScore: Number(score.toFixed(2)),
    };
  });
}
