import Anthropic from "@anthropic-ai/sdk";

const TOKENROUTER_BASE_URL = "https://api.tokenrouter.com";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.tokenrouter ?? process.env.TOKENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TokenRouter API key is not set. Copy .env.example to .env.local and set the `tokenrouter` key."
    );
  }
  client = new Anthropic({
    apiKey,
    authToken: apiKey,
    baseURL: process.env.TOKENROUTER_BASE_URL ?? TOKENROUTER_BASE_URL,
  });
  return client;
}

export const ANALYSIS_MODEL =
  process.env.TOKENROUTER_MODEL ?? "anthropic/claude-opus-4.5";
