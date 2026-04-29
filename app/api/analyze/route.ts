import { NextRequest, NextResponse } from "next/server";
import { ANALYSIS_MODEL, getClient } from "@/lib/anthropic";
import { ANALYSIS_PROMPT, ANALYSIS_TOOL, SYSTEM_PROMPT } from "@/lib/prompt";
import type { Analysis, AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const started = Date.now();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Could not read form data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file was uploaded." },
      { status: 400 }
    );
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported file type: ${file.type || "unknown"}. Upload a PDF or image.`,
      },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File is larger than 25 MB." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  const fileBlock =
    file.type === "application/pdf"
      ? {
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: base64,
          },
        }
      : {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: normalizeImageMediaType(file.type),
            data: base64,
          },
        };

  let client;
  try {
    client = getClient();
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Anthropic API key is not configured.",
      },
      { status: 500 }
    );
  }

  let analysis: Analysis;
  try {
    const response = await client.messages.create({
      model: ANALYSIS_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
      messages: [
        {
          role: "user",
          content: [fileBlock, { type: "text", text: ANALYSIS_PROMPT }],
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Extract<typeof block, { type: "tool_use" }> =>
        block.type === "tool_use" && block.name === ANALYSIS_TOOL.name
    );

    if (!toolUse) {
      return NextResponse.json(
        { error: "Claude did not return a structured analysis." },
        { status: 502 }
      );
    }

    analysis = normalizeAnalysis(toolUse.input as Partial<Analysis>);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to analyze the document.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const payload: AnalyzeResponse = {
    analysis,
    fileName: file.name,
    fileSize: file.size,
    durationMs: Date.now() - started,
  };

  return NextResponse.json(payload);
}

function normalizeImageMediaType(
  type: string
): "image/png" | "image/jpeg" | "image/webp" | "image/gif" {
  if (type === "image/jpg") return "image/jpeg";
  if (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "image/webp" ||
    type === "image/gif"
  ) {
    return type;
  }
  return "image/jpeg";
}

function normalizeAnalysis(raw: Partial<Analysis>): Analysis {
  return {
    summary: typeof raw.summary === "string" ? raw.summary : "",
    agreements: Array.isArray(raw.agreements) ? raw.agreements : [],
    risks: Array.isArray(raw.risks) ? raw.risks : [],
    doctorQuestions: Array.isArray(raw.doctorQuestions)
      ? raw.doctorQuestions
      : [],
    redFlags: Array.isArray(raw.redFlags)
      ? raw.redFlags.map((flag, idx) => ({
          id: flag.id || `flag-${idx + 1}`,
          severity:
            flag.severity === "high" ||
            flag.severity === "medium" ||
            flag.severity === "low"
              ? flag.severity
              : "medium",
          title: flag.title ?? "Flagged clause",
          why: flag.why ?? "",
          quote: flag.quote ?? "",
          ask: flag.ask ?? "",
        }))
      : [],
  };
}
