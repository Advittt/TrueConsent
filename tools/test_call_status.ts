// Smoke-test the call status API shape used by the live call UI.
//
// Run with:
//   npx tsx tools/test_call_status.ts

import { NextRequest } from "next/server";

import { GET } from "../app/api/call-status/route";

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function main() {
  const res = await GET(new NextRequest("http://localhost/api/call-status?callId=demo-test"));
  const body = await res.json();

  assert(res.status === 200, `expected HTTP 200, got ${res.status}`);
  assert(typeof body.durationMs === "number", "expected durationMs to be present");
  assert(body.durationMs >= 0, `expected non-negative durationMs, got ${body.durationMs}`);
  assert(Array.isArray(body.transcripts), "expected transcripts array");
  assert(body.startedAt, "expected startedAt timestamp");

  await new Promise((resolve) => setTimeout(resolve, 1100));

  const nextRes = await GET(new NextRequest("http://localhost/api/call-status?callId=demo-test"));
  const nextBody = await nextRes.json();

  assert(
    nextBody.durationMs > body.durationMs,
    `expected durationMs to advance, got ${body.durationMs} then ${nextBody.durationMs}`
  );

  await new Promise((resolve) => setTimeout(resolve, 2200));

  const fastRes = await GET(new NextRequest("http://localhost/api/call-status?callId=demo-test"));
  const fastBody = await fastRes.json();
  const transcriptText = fastBody.transcripts.map((line: { text: string }) => line.text).join("\n");

  assert(fastBody.status === "connected", `expected demo to connect after ~3s, got ${fastBody.status}`);
  assert(
    transcriptText.includes("Representative connected."),
    "expected representative to be connected after ~3s"
  );
  assert(
    transcriptText.includes("Still on hold (3 seconds)…"),
    "expected demo hold copy to say 3 seconds"
  );
  assert(
    !transcriptText.includes("Still on hold (26 seconds)…"),
    "did not expect old 26-second hold copy"
  );

  console.table([{
    status: fastBody.status,
    firstDurationMs: body.durationMs,
    nextDurationMs: nextBody.durationMs,
    fastDurationMs: fastBody.durationMs,
    transcripts: fastBody.transcripts.length,
    startedAt: body.startedAt,
  }]);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
