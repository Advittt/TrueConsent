import { NextRequest, NextResponse } from "next/server";

// Bland AI sends POST webhooks here as the call progresses.
// We return 200 immediately — actual status is polled by the client
// via GET /api/call-status?callId=xxx using Bland's status endpoint.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await req.json(); // consume body
  } catch {
    // ignore parse errors
  }
  return NextResponse.json({ ok: true });
}

// Client polls this to get live call status from Bland.
export async function GET(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("callId");

  // Demo mode — return a scripted transcript progression.
  if (!callId || callId.startsWith("demo-") || !process.env.BLAND_API_KEY) {
    return NextResponse.json(demoStatus());
  }

  let blandRes: Response;
  try {
    blandRes = await fetch(`https://api.bland.ai/v1/calls/${callId}`, {
      headers: { authorization: process.env.BLAND_API_KEY },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Bland AI." },
      { status: 502 }
    );
  }

  if (!blandRes.ok) {
    return NextResponse.json(
      { error: `Bland status error ${blandRes.status}` },
      { status: 502 }
    );
  }

  const raw = (await blandRes.json()) as BlandCallStatus;
  return NextResponse.json(normalizeBlandStatus(raw));
}

interface BlandCallStatus {
  call_id?: string;
  status?: string;
  transcripts?: { created_at?: string; user?: string; text?: string }[];
  analysis?: { reference_number?: string; summary?: string };
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
}

function normalizeBlandStatus(raw: BlandCallStatus) {
  const transcripts = (raw.transcripts ?? []).map((t, i) => ({
    t: i * 8,
    role: t.user === "user" ? "rep" : "agent",
    text: t.text ?? "",
  }));

  const status = mapBlandStatus(raw.status ?? "");
  const referenceNumber = raw.analysis?.reference_number;

  return {
    status,
    transcripts,
    referenceNumber,
    recordingUrl: raw.recording_url,
    startedAt: raw.started_at,
    endedAt: raw.ended_at,
  };
}

function mapBlandStatus(s: string): string {
  if (s === "completed") return "complete";
  if (s === "failed" || s === "error") return "failed";
  if (s === "in-progress") return "connected";
  return s || "dialing";
}

// ── Demo mode ────────────────────────────────────────────────────────────────
// Returns a deterministic transcript that advances based on current time.
// The client starts polling after the call is initiated; each poll returns
// a few more lines. After ~90 seconds the call is "complete" with a ref number.

const DEMO_TRANSCRIPT = [
  { t: 0,  role: "system",  text: "Dialing BlueCross BlueShield appeals line…" },
  { t: 4,  role: "system",  text: "Connected to automated phone system." },
  { t: 9,  role: "agent",   text: "Navigating IVR — saying 'appeals'…" },
  { t: 16, role: "system",  text: "Transferred to claims department. On hold." },
  { t: 42, role: "system",  text: "Still on hold (26 seconds)…" },
  { t: 68, role: "system",  text: "Representative connected." },
  { t: 71, role: "rep",     text: "Thank you for calling BlueCross. This is Sarah, how can I help you?" },
  { t: 74, role: "agent",   text: "Hi Sarah, I'm calling on behalf of Jane Q. Smith, Member ID BCB-2204819334. I have a signed representative authorization. I'm calling to file a Level 1 internal appeal for claim number 48291, which was denied under CO-50." },
  { t: 82, role: "rep",     text: "Let me pull that up… okay, I see the claim. The denial was for medical necessity on CPT 99285. What's the basis for the appeal?" },
  { t: 86, role: "agent",   text: "The admitting diagnosis was J18.9 — pneumonia. An emergency department evaluation for pneumonia is medically necessary by clinical definition. The ACEP guidelines support ER evaluation for respiratory infections presenting with these symptoms." },
  { t: 96, role: "rep",     text: "I understand. I'm initiating a Level 1 appeal on this claim. You'll receive written confirmation within 5 business days." },
  { t: 101, role: "agent",  text: "Can I get a reference number for the appeal?" },
  { t: 105, role: "rep",    text: "Yes, your appeal reference number is AP-2847. The resolution timeframe is 30 days from today." },
  { t: 109, role: "agent",  text: "Thank you Sarah. To confirm — appeal AP-2847 initiated for claim 48291, resolution within 30 days. Is that correct?" },
  { t: 113, role: "rep",    text: "That's correct. Is there anything else I can help you with?" },
  { t: 116, role: "agent",  text: "No, that's everything. Thank you for your help." },
  { t: 119, role: "system", text: "Call ended. Duration: 1m 59s." },
];

let _demoStart: number | null = null;

function demoStatus() {
  if (!_demoStart) _demoStart = Date.now();
  const elapsed = (Date.now() - _demoStart) / 1000;

  const visible = DEMO_TRANSCRIPT.filter((l) => l.t <= elapsed);
  const complete = elapsed >= 125;
  const status = elapsed < 4 ? "dialing"
    : elapsed < 68 ? "on_hold"
    : elapsed < 119 ? "connected"
    : "complete";

  return {
    status,
    transcripts: visible,
    referenceNumber: complete ? "AP-2847" : undefined,
    startedAt: new Date(_demoStart).toISOString(),
    endedAt: complete ? new Date(_demoStart + 125000).toISOString() : undefined,
  };
}
