import type { ClauseTag, PatternHit, Severity } from "@/lib/types";

interface PatternRule {
  tag: ClauseTag;
  label: string;
  severity: Severity;
  patterns: RegExp[];
}

const PATTERN_RULES: PatternRule[] = [
  {
    tag: "arbitration",
    label: "Binding arbitration / waiver of jury",
    severity: "high",
    patterns: [
      /\bbinding arbitration\b/i,
      /\bwaiv(?:e|er) (?:of )?(?:my )?right to (?:a )?(?:jury )?trial\b/i,
      /\bclass(?:-| )action waiver\b/i,
    ],
  },
  {
    tag: "release-of-liability",
    label: "Release of liability",
    severity: "high",
    patterns: [
      /\brelease(?:s)? .* from (?:any|all) (?:liability|claims?)\b/i,
      /\bhold (?:harmless|us harmless)\b/i,
      /\bindemnify\b/i,
    ],
  },
  {
    tag: "blanket-consent",
    label: "Blanket / open-ended consent",
    severity: "high",
    patterns: [
      /\bsole discretion\b/i,
      /\bany and all (?:procedures?|treatments?)\b/i,
      /\bdeem(?:s|ed)? (?:medically )?necessary\b/i,
      /\bsuch (?:other|additional) procedures? as\b/i,
    ],
  },
  {
    tag: "irrevocable-grant",
    label: "Irrevocable rights granted",
    severity: "high",
    patterns: [/\birrevocab/i, /\bperpetuity\b/i, /\bin perpetuity\b/i],
  },
  {
    tag: "data-sharing",
    label: "Broad data / record sharing",
    severity: "medium",
    patterns: [
      /\bshare (?:my )?(?:medical )?(?:records?|information|data) with\b/i,
      /\bdisclose (?:my )?(?:protected )?health information\b/i,
      /\baffiliates?, partners?, (?:and )?vendors?\b/i,
    ],
  },
  {
    tag: "third-party-disclosure",
    label: "Third-party disclosure",
    severity: "medium",
    patterns: [
      /\bthird[- ]part(?:y|ies)\b/i,
      /\bbusiness associate\b/i,
      /\bdownstream provider\b/i,
    ],
  },
  {
    tag: "marketing-use",
    label: "Marketing / research use of data",
    severity: "medium",
    patterns: [
      /\bmarketing (?:purposes?|use)\b/i,
      /\bresearch (?:purposes?|use)\b/i,
      /\bde-?identified data\b/i,
    ],
  },
  {
    tag: "recording-consent",
    label: "Audio / video recording consent",
    severity: "medium",
    patterns: [
      /\brecord(?:ing)? (?:of )?(?:the )?(?:visit|session|consultation)\b/i,
      /\bvideo[- ]record/i,
      /\baudio[- ]record/i,
    ],
  },
  {
    tag: "financial-responsibility",
    label: "Financial responsibility shift",
    severity: "medium",
    patterns: [
      /\bfinancial(?:ly)? responsib(?:le|ility)\b/i,
      /\bguarantor\b/i,
      /\bcollection (?:agency|costs)\b/i,
      /\binterest (?:will )?accru/i,
    ],
  },
  {
    tag: "anesthesia-waiver",
    label: "Anesthesia-specific risk acknowledgement",
    severity: "low",
    patterns: [
      /\bmalignant hyperthermia\b/i,
      /\baspiration pneumonitis\b/i,
      /\banesthesia (?:risks?|complications?)\b/i,
    ],
  },
];

export function findPatternHits(text: string | null): PatternHit[] {
  if (!text) return [];
  const hits: PatternHit[] = [];
  const seen = new Set<string>();

  for (const rule of PATTERN_RULES) {
    for (const pat of rule.patterns) {
      const m = text.match(pat);
      if (!m || m.index === undefined) continue;
      const key = rule.tag + "::" + m[0].toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const start = Math.max(0, m.index - 60);
      const end = Math.min(text.length, m.index + m[0].length + 80);
      const excerpt = text.slice(start, end).replace(/\s+/g, " ").trim();

      hits.push({
        tag: rule.tag,
        label: rule.label,
        severity: rule.severity,
        excerpt,
        offset: m.index,
      });
    }
  }

  return hits.sort((a, b) => {
    const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity] || a.offset - b.offset;
  });
}
