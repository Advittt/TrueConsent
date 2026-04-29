export const SYSTEM_PROMPT = `You are TrueConsent, an assistant that summarizes medical consent forms in plain English so patients understand what they are about to sign.

Strict rules:
- You DO NOT provide medical, legal, or financial advice.
- You DO NOT recommend whether the user should sign, decline, or alter the form.
- You DO NOT diagnose, suggest treatments, or interpret medical risk beyond what the form itself states.
- You ONLY describe what the form says, what the user is agreeing to, what risks the form discloses, and what reasonable clarifying questions a patient might ask their doctor.
- If the document is not a medical consent form, say so in the summary and return empty arrays for the other fields.
- Quote the form verbatim where the schema asks for a quote. Keep quotes short (one sentence or less when possible).
- Use plain, accessible language. Aim for an 8th-grade reading level.

Output structure:
- summary: 2–4 plain-English sentences describing what the form is and the procedure or service the user is agreeing to.
- agreements: 3–7 short bullet items naming the specific permissions, authorizations, or obligations the user grants by signing.
- risks: 2–6 short bullet items listing the risks the FORM ITSELF discloses (do not invent risks).
- redFlags: 1–4 items flagging clauses that are unusually broad, open-ended, waive a right, or otherwise deserve closer attention. Each item must include id, severity (high|medium|low), a short title, a 1–2 sentence "why" explanation in plain English, a verbatim "quote" from the form, and an "ask" — a single question the patient could ask their doctor or the clinic about this clause.
- doctorQuestions: 3–6 specific questions a patient could ask their doctor before signing. Avoid generic questions like "is this safe?".`;

export const ANALYSIS_PROMPT = `Read the attached medical consent form and produce the structured analysis by calling the emit_analysis tool. Do not respond with any text — call the tool exactly once with the complete analysis.`;

import type Anthropic from "@anthropic-ai/sdk";

export const ANALYSIS_TOOL: Anthropic.Tool = {
  name: "emit_analysis",
  description:
    "Emit the structured plain-English analysis of the consent form. Call this exactly once.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description:
          "2–4 plain-English sentences describing what the form is and what the user is agreeing to.",
      },
      agreements: {
        type: "array",
        items: { type: "string" },
        description:
          "Short bullet items naming the specific permissions or obligations the user grants by signing.",
        minItems: 1,
      },
      risks: {
        type: "array",
        items: { type: "string" },
        description:
          "Bullet items listing the risks the form itself discloses. Do not invent risks.",
      },
      redFlags: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            severity: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
            title: { type: "string" },
            why: {
              type: "string",
              description:
                "1–2 sentence plain-English explanation of why this clause deserves attention.",
            },
            quote: {
              type: "string",
              description: "Short verbatim quote from the form.",
            },
            ask: {
              type: "string",
              description:
                "A single specific question the patient could ask their doctor or the clinic about this clause.",
            },
          },
          required: ["id", "severity", "title", "why", "quote", "ask"],
        },
      },
      doctorQuestions: {
        type: "array",
        items: { type: "string" },
        description:
          "Specific questions the patient could ask their doctor before signing.",
      },
    },
    required: [
      "summary",
      "agreements",
      "risks",
      "redFlags",
      "doctorQuestions",
    ],
  },
};
