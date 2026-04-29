import type { ClauseTag, RedFlag } from "@/lib/types";

const TAG_KEYWORDS: { tag: ClauseTag; words: RegExp[] }[] = [
  { tag: "arbitration", words: [/arbitr/i, /jury (?:trial|waiver)/i, /class[- ]action/i] },
  { tag: "release-of-liability", words: [/liabilit/i, /hold harmless/i, /indemnif/i, /release.*claim/i] },
  { tag: "blanket-consent", words: [/sole discretion/i, /any and all/i, /deemed? necessary/i] },
  { tag: "irrevocable-grant", words: [/irrevocab/i, /perpetuit/i] },
  { tag: "data-sharing", words: [/share.*record/i, /disclose.*health/i, /\bphi\b/i] },
  { tag: "third-party-disclosure", words: [/third[- ]part/i, /vendor/i, /affiliate/i] },
  { tag: "marketing-use", words: [/marketing/i, /research use/i, /de[- ]identif/i] },
  { tag: "recording-consent", words: [/record(?:ing)?/i, /audio/i, /video/i] },
  { tag: "anesthesia-waiver", words: [/anesthe/i, /sedation/i] },
  { tag: "financial-responsibility", words: [/financial/i, /payment/i, /collection/i, /balance/i] },
];

export function classifyRedFlag(flag: RedFlag): ClauseTag | "other" {
  const haystack = `${flag.title} ${flag.why} ${flag.quote}`.toLowerCase();
  for (const { tag, words } of TAG_KEYWORDS) {
    if (words.some((w) => w.test(haystack))) return tag;
  }
  return "other";
}

export function classifyAll(flags: RedFlag[]) {
  return flags.map((f) => ({
    id: f.id,
    tag: classifyRedFlag(f),
    label: f.title,
  }));
}
