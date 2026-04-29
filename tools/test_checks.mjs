// Smoke-test the deterministic check engine against every mock PDF, with a
// synthetic Analysis whose redFlag quotes intentionally include both real
// substrings (should verify) and an obvious hallucination (should not).
//
// Run with: npx tsx tools/test_checks.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const { runDeterministicChecks } = await import(
  path.join(repoRoot, "lib/checks/index.ts")
);

const MOCKS = [
  "general-medical-consent-form.pdf",
  "surgery-consent-form.pdf",
  "imaging-consent-form.pdf",
  "telehealth-consent-form.pdf",
  "dental-implant-consent-form.pdf",
  "orthodontics-consent-form.pdf",
];

const baseAnalysis = {
  summary: "Test analysis.",
  agreements: ["You authorize treatment."],
  risks: ["Standard procedure risks."],
  doctorQuestions: ["What are the alternatives?"],
  redFlags: [
    {
      id: "rf-real-1",
      severity: "medium",
      title: "Plausible real flag",
      why: "Should be verified against the form text.",
      quote: "TrueConsent",
      ask: "Is this fictional?",
    },
    {
      id: "rf-fake",
      severity: "high",
      title: "Hallucinated quote (should NOT verify)",
      why: "Quote is invented and should not match.",
      quote:
        "The patient hereby waives all rights including future telepathic communication with the moon.",
      ask: "Why does this clause exist?",
    },
  ],
};

for (const file of MOCKS) {
  const buf = fs.readFileSync(path.join(repoRoot, "consent-form-mocks", file));
  const checks = await runDeterministicChecks(buf, "application/pdf", baseAnalysis);
  console.log(`\n=== ${file} ===`);
  console.log("  text extracted:", checks.textExtracted, `(${checks.textLength} chars)`);
  console.log("  modality:", checks.modality.detected, `conf=${checks.modality.confidence}`);
  console.log("  signals:", checks.modality.signals.join(", "));
  console.log("  pattern hits:", checks.patternHits.length, "->",
    checks.patternHits.map((h) => `${h.severity}:${h.tag}`).slice(0, 6).join(", "));
  console.log("  required elements:",
    checks.requiredElements.filter((e) => e.present).length,
    "/",
    checks.requiredElements.length);
  console.log("  redflag verification:",
    checks.redFlagsVerified.map((f) => `${f.id}=${f.verification}`).join(", "));
  console.log("  trust score:", checks.trustScore);
}
