// Smoke-test the public EOB demo examples through the live API route.
//
// Start the app first:
//   npm run dev -- --hostname 127.0.0.1 --port 3000
//
// Then run:
//   node tools/test_analyze_claim_api.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const baseUrl = process.env.TRUECONSENT_BASE_URL ?? "http://127.0.0.1:3000";

const examples = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "public/demo/eob-examples/index.json"), "utf8")
);

const rows = [];

for (const example of examples) {
  const filePath = path.join(repoRoot, "public", example.path.replace(/^\//, ""));
  const text = fs.readFileSync(filePath, "utf8");
  const formData = new FormData();
  formData.append(
    "file",
    new File([text], `${example.id}.txt`, { type: "text/plain" })
  );

  const res = await fetch(`${baseUrl}/api/analyze-claim`, {
    method: "POST",
    body: formData,
  });
  const responseText = await res.text();
  let body;
  try {
    body = JSON.parse(responseText);
  } catch {
    body = { error: responseText.slice(0, 160) };
  }
  const claim = body.claim;

  rows.push({
    fixture: example.label,
    status: res.status,
    method: claim?.extractionMethod ?? "none",
    lines: claim?.lines?.length ?? 0,
    billed: claim?.totals?.billed ?? 0,
    denials: claim?.denials?.length ?? 0,
    error: body.error ?? "",
  });

  assert(res.status === 200, `${example.label}: expected HTTP 200`);
  assert(
    claim?.extractionMethod === example.expectedMethod,
    `${example.label}: expected ${example.expectedMethod}, got ${claim?.extractionMethod}`
  );

  if (example.expectedMethod === "failed") {
    assert(claim.kind === "unknown", `${example.label}: expected unknown kind`);
    assert(claim.lines.length === 0, `${example.label}: expected no accepted lines`);
  } else {
    assert(claim.lines.length >= 2, `${example.label}: expected at least 2 lines`);
    assert(claim.totals.billed > 0, `${example.label}: expected billed total > 0`);
  }
}

console.table(rows);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
