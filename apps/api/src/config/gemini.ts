import "dotenv/config";

import {
    GoogleGenAI,
} from "@google/genai";

const apiKey =
  process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not configured. Add it to apps/api/.env",
  );
}

export const geminiModel =
  process.env.GEMINI_MODEL?.trim() ||
  "gemini-3.6-flash";

export const geminiEmbedModel =
  process.env.GEMINI_EMBED_MODEL?.trim() ||
  "text-embedding-004";

export const gemini =
  new GoogleGenAI({
    apiKey,
  });
