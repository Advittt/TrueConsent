import { NextRequest, NextResponse } from "next/server";
import { lookupInsurer } from "@/lib/insurers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InitiateCallBody {
  claimId: string;
  memberId?: string;
  patientName: string;
  insurerName: string;
  serviceDate?: string;
  denialCode: string;
  denialReason: string;
  procedureCode: string;
  procedureDescription: string;
  billedAmount: number;
  authSignedAt: string;
  demoMode?: boolean;
}

export async function POST(req: NextRequest) {
  let body: InitiateCallBody;
  try {
    body = (await req.json()) as InitiateCallBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const insurer = lookupInsurer(body.insurerName);

  // Demo mode — return a fake call ID immediately without hitting Bland.
  if (body.demoMode || !process.env.BLAND_API_KEY) {
    return NextResponse.json({
      callId: `demo-${Date.now()}`,
      phone: insurer.appealsPhone,
      insurerName: insurer.name,
      demo: true,
    });
  }

  const task = buildTask(body, insurer);

  let blandRes: Response;
  try {
    blandRes = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        authorization: process.env.BLAND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: insurer.appealsPhone,
        task,
        voice: "nat",
        record: true,
        webhook: process.env.NEXT_PUBLIC_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/call-status`
          : undefined,
        metadata: { claimId: body.claimId, patientName: body.patientName },
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reach Bland AI." },
      { status: 502 }
    );
  }

  if (!blandRes.ok) {
    const text = await blandRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Bland AI error ${blandRes.status}: ${text}` },
      { status: 502 }
    );
  }

  const data = (await blandRes.json()) as { call_id?: string };
  return NextResponse.json({
    callId: data.call_id ?? "unknown",
    phone: insurer.appealsPhone,
    insurerName: insurer.name,
    demo: false,
  });
}

function buildTask(body: InitiateCallBody, insurer: ReturnType<typeof lookupInsurer>): string {
  return `You are calling ${insurer.name} on behalf of a patient to file a Level 1 internal appeal for a wrongfully denied insurance claim.

PATIENT INFORMATION:
- Patient name: ${body.patientName}
- Member ID: ${body.memberId ?? "on file with insurer"}
- Claim number: ${body.claimId}
- Date of service: ${body.serviceDate ?? "June 14, 2026"}
- You have a signed representative authorization from the patient dated ${body.authSignedAt}.

DENIED SERVICE:
- Procedure: ${body.procedureCode} — ${body.procedureDescription}
- Billed amount: $${(body.billedAmount / 100).toFixed(2)}
- Denial reason code: ${body.denialCode}
- Denial reason: ${body.denialReason}

IVR NAVIGATION:
${insurer.ivrHint}

CALL SCRIPT (once connected to a representative):
1. "Hi, my name is [your name] and I'm calling on behalf of ${body.patientName}, Member ID ${body.memberId ?? "on file"}. I have a signed representative authorization on file. I'm calling to file a Level 1 internal appeal for claim number ${body.claimId}."

2. Wait for them to pull up the claim. If they ask about authorization, say: "Yes, I have a signed representative authorization dated ${body.authSignedAt}. I can provide a copy if needed."

3. "The claim was denied under ${body.denialCode}. I'm appealing on the grounds that ${body.procedureDescription} was medically necessary given the patient's admitting diagnosis. The denial appears to be inconsistent with the clinical presentation."

4. Ask: "Can you initiate a Level 1 appeal on this claim right now, and give me a reference number?"

5. Ask: "What is the expected resolution timeframe for this appeal?"

6. Thank them and confirm: "So just to confirm — appeal is initiated, reference number is [X], resolution expected within [Y] days. Is that correct?"

IMPORTANT:
- Be polite and professional throughout.
- Do not hang up until you have a reference number OR have been told the appeal cannot be initiated by phone.
- If transferred to voicemail, leave a brief message with the patient name, claim number, and callback number.
- If on hold for more than 15 minutes, note it in your report.`;
}
