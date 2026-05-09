export interface ExtractedCodes {
  cpt: string[];
  hcpcs: string[];
  icd10: string[];
  carc: string[];
  rarc: string[];
}

export function extractCodes(text: string): ExtractedCodes {
  const cptMatches = [...text.matchAll(/\b(\d{5})\b/g)].map((m) => m[1]);
  const hcpcsMatches = [...text.matchAll(/\b([A-Z]\d{4})\b/g)].map((m) => m[1]);
  const icd10Matches = [
    ...text.matchAll(/\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/g),
  ].map((m) => m[1]);
  const carcMatches = [...text.matchAll(/\b(CO-\d+|PR-\d+|OA-\d+)\b/g)].map(
    (m) => m[1]
  );
  const rarcMatches = [
    ...text.matchAll(/\bRARC\s+([NM]\d+)\b|\b([NM]\d{2,4})\b/g),
  ].map((m) => m[1] ?? m[2]);

  return {
    cpt: [...new Set(cptMatches)],
    hcpcs: [...new Set(hcpcsMatches)],
    icd10: [...new Set(icd10Matches)],
    carc: [...new Set(carcMatches)],
    rarc: [...new Set(rarcMatches)],
  };
}
