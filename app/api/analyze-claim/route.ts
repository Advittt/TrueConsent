import { NextRequest, NextResponse } from "next/server";
import { analyzeClaimFromText } from "@/lib/analyze-claim";
import { extractPdfText } from "@/lib/extract-pdf-text";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return errorResponse("Could not read form data.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("No file was uploaded.", 400);
  }

  let text: string;
  try {
    if (file.type === "application/pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractPdfText(buffer);
      if (!extracted) return errorResponse("Could not extract text from PDF.", 422);
      text = extracted;
    } else {
      text = await file.text();
    }
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Failed to read file.", 500);
  }

  try {
    const payload = await analyzeClaimFromText(text);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to analyze claim.",
      500
    );
  }
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
