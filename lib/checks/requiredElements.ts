import type { RequiredElement } from "@/lib/types";

const ELEMENT_RULES: { name: string; patterns: RegExp[] }[] = [
  {
    name: "Patient name field",
    patterns: [/\bpatient name\b/i, /\bname of patient\b/i],
  },
  {
    name: "Date of birth",
    patterns: [/\bdate of birth\b/i, /\bDOB\b/],
  },
  {
    name: "Signature line",
    patterns: [
      /\bpatient (?:or representative )?signature\b/i,
      /\bsignature[:_\s-]/i,
    ],
  },
  {
    name: "Date signed",
    patterns: [/\bdate(?:\s+signed)?[:_\s-]/i, /\bsigned (?:on )?date\b/i],
  },
  {
    name: "Witness or guardian",
    patterns: [/\bwitness\b/i, /\bguardian\b/i, /\blegal representative\b/i],
  },
  {
    name: "Form ID / revision",
    patterns: [/\bform\s+(?:no\.?|number|cons-?\d+)/i, /\brev\.?\s*\d/i],
  },
  {
    name: "Provider / clinic name",
    patterns: [/\bprovider\b/i, /\bclinic\b/i, /\bhospital\b/i, /\bphysician\b/i],
  },
];

export function checkRequiredElements(text: string | null): RequiredElement[] {
  if (!text) return ELEMENT_RULES.map((r) => ({ name: r.name, present: false }));
  return ELEMENT_RULES.map((r) => ({
    name: r.name,
    present: r.patterns.some((p) => p.test(text)),
  }));
}
