import type { Modality, ModalityResult } from "@/lib/types";

// Each rule has SPECIFIC keywords (rare, modality-defining) and BROAD keywords
// (modality-suggestive but easy to false-positive). A specific hit on its own
// is enough to win; broad hits only matter as tie-breakers.

interface ModalityRule {
  modality: Modality;
  specific: RegExp[];
  broad: RegExp[];
}

const MODALITY_RULES: ModalityRule[] = [
  {
    modality: "dental-implant",
    specific: [
      /\bdental implant\b/i,
      /\btitanium (?:fixture|post|implant)\b/i,
      /\bbone graft\b/i,
      /\bsinus lift\b/i,
      /\bosseointegration\b/i,
      /\babutment\b/i,
    ],
    broad: [/\bdental\b/i, /\btooth (?:extraction|loss)\b/i],
  },
  {
    modality: "orthodontics",
    specific: [
      /\borthodontic\b/i,
      /\binvisalign\b/i,
      /\bmalocclusion\b/i,
      /\baligners?\b/i,
    ],
    broad: [/\bbraces\b/i, /\btooth movement\b/i],
  },
  {
    modality: "imaging",
    specific: [
      /\balara\b/i,
      /\biodinated\b/i,
      /\bgadolinium\b/i,
      /\bcontrast (?:media|agent)\b/i,
      /\bms\s*v\b/i,
      /\bradiologic(?:al)?\b/i,
    ],
    broad: [/\bradiation\b/i, /\bct (?:scan|imaging)\b/i, /\bx-?ray\b/i, /\bmri\b/i],
  },
  {
    modality: "telehealth",
    specific: [
      /\btelehealth (?:consent|visit|service)\b/i,
      /\btelemedicine\b/i,
      /\bvideo visit\b/i,
      /\bconnection failure\b/i,
      /\bcross[- ]state licensure\b/i,
    ],
    broad: [/\btelehealth\b/i, /\bvirtual visit\b/i],
  },
  {
    modality: "surgery",
    specific: [
      /\bsurgical procedure consent\b/i,
      /\boperative report\b/i,
      /\bmalignant hyperthermia\b/i,
      /\banesthesia and sedation sub-?consent\b/i,
    ],
    broad: [/\bsurgical\b/i, /\bsurgeon\b/i, /\bincision\b/i, /\bgeneral anesthesia\b/i],
  },
  {
    modality: "general",
    specific: [
      /\bgeneral medical consent\b/i,
      /\bgeneral consent for treatment\b/i,
      /\bauthorization for treatment\b/i,
    ],
    broad: [/\btreatment\b/i, /\binsurance assignment\b/i],
  },
];

const SPECIFIC_WEIGHT = 5;
const BROAD_WEIGHT = 1;

export function detectModality(text: string | null): ModalityResult {
  if (!text) {
    return { detected: "unknown", confidence: 0, signals: [] };
  }

  const scores: Record<
    string,
    { score: number; signals: string[] }
  > = {};

  for (const rule of MODALITY_RULES) {
    let score = 0;
    const signals: string[] = [];
    for (const re of rule.specific) {
      const m = text.match(re);
      if (m) {
        score += SPECIFIC_WEIGHT;
        signals.push(m[0]);
      }
    }
    for (const re of rule.broad) {
      const m = text.match(re);
      if (m) {
        score += BROAD_WEIGHT;
        signals.push(m[0]);
      }
    }
    if (score > 0) scores[rule.modality] = { score, signals };
  }

  const entries = Object.entries(scores).sort(
    (a, b) => b[1].score - a[1].score
  );
  if (entries.length === 0) {
    return { detected: "unknown", confidence: 0, signals: [] };
  }

  const [winner, info] = entries[0];
  const total = entries.reduce((s, [, v]) => s + v.score, 0);
  const confidence = Number((info.score / total).toFixed(2));

  return {
    detected: winner as Modality,
    confidence,
    signals: info.signals.slice(0, 4),
  };
}
