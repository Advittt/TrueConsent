import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { decodeClaim } from "../lib/decode";

const fixturesDir = path.join(process.cwd(), "tests/fixtures");

async function fixture(name: string): Promise<string> {
  return readFile(path.join(fixturesDir, name), "utf8");
}

describe("decodeClaim fixture behavior", () => {
  it("decodes a successful EOB with appealable denial lines", async () => {
    const claim = await decodeClaim(await fixture("successful-appealable-eob.txt"));

    assert.equal(claim.kind, "eob");
    assert.equal(claim.extractionMethod, "regex");
    assert.equal(claim.claimId, "48291");
    assert.equal(claim.lines.length, 3);
    assert.equal(claim.totals.billed, 250400);
    assert.equal(claim.totals.insurancePaid, 52500);
    assert.equal(claim.totals.patientResponsibility, 8500);
    assert.equal(claim.denials.length, 1);
    assert.equal(claim.denials[0]?.carc.code, "CO-50");
  });

  it("returns an unknown failed claim for unsupported text", async () => {
    const claim = await decodeClaim(await fixture("unsupported-document.txt"));

    assert.equal(claim.kind, "unknown");
    assert.equal(claim.extractionMethod, "failed");
    assert.equal(claim.lines.length, 0);
    assert.equal(claim.denials.length, 0);
    assert.equal(claim.totals.billed, 0);
  });

  it("fails closed when fallback extraction is needed but LLM credentials are unavailable", async () => {
    const oldTokenrouter = process.env.tokenrouter;
    const oldTokenrouterApiKey = process.env.TOKENROUTER_API_KEY;
    process.env.tokenrouter = "";
    process.env.TOKENROUTER_API_KEY = "";

    try {
      const claim = await decodeClaim(await fixture("llm-fallback-needed-eob.txt"));

      assert.equal(claim.kind, "unknown");
      assert.equal(claim.extractionMethod, "failed");
      assert.equal(claim.lines.length, 0);
      assert.equal(claim.totals.billed, 0);
    } finally {
      restoreEnv("tokenrouter", oldTokenrouter);
      restoreEnv("TOKENROUTER_API_KEY", oldTokenrouterApiKey);
    }
  });
});

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
