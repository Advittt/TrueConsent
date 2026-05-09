import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { POST } from "../app/api/analyze-claim/route";

const fixturesDir = path.join(process.cwd(), "tests/fixtures");

describe("POST /api/analyze-claim", () => {
  it("analyzes a local text fixture without external services", async () => {
    const text = await readFile(path.join(fixturesDir, "route-success-eob.txt"), "utf8");
    const formData = new FormData();
    formData.append("file", new File([text], "route-success-eob.txt", { type: "text/plain" }));

    const response = await POST(
      new Request("http://localhost/api/analyze-claim", {
        method: "POST",
        body: formData,
      }) as never
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(body.claim.extractionMethod, "regex");
    assert.equal(body.claim.claimId, "48292");
    assert.equal(body.claim.lines.length, 2);
    assert.equal(body.claim.denials.length, 0);
    assert.equal(body.extraction.source, "regex");
    assert.equal(body.appealLetter, "No appealable denials were identified on this claim.");
  });

  it("returns a 400 when no upload file is present", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze-claim", {
        method: "POST",
        body: new FormData(),
      }) as never
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "No file was uploaded.");
  });
});
