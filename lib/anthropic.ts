import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and set the key."
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

export const ANALYSIS_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
