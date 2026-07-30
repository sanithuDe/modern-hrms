import "dotenv/config";

import {
  gemini,
  geminiEmbedModel,
} from "../config/gemini.js";

/**
 * Built-in Output Sanitizer (inspired by WRDN / demo-wrdn).
 * Runs inside the HR API — no separate WRDN project connection.
 *
 * Layers:
 * 1) Regex — secrets, credential leaks, named payroll dumps
 * 2) Gemini embeddings — semantic similarity to sensitive disclosures
 *
 * Env (apps/api/.env):
 *   OUTPUT_SANITIZER_ENABLED=true
 *   GEMINI_EMBED_MODEL=text-embedding-004   (optional)
 *   OUTPUT_SANITIZER_BLOCK_THRESHOLD=70     (optional)
 *   OUTPUT_SANITIZER_SIMILARITY=0.72        (optional)
 *   OUTPUT_SANITIZER_FAIL_OPEN=false       (optional; true = allow if embed fails)
 */

export type SanitizeStatus = "ALLOWED" | "BLOCKED" | "ERROR";

export interface SanitizeResult {
  status: SanitizeStatus;
  risk_score: number;
  reason: string;
  detection_layer: string;
  final_output: string;
  allowed: boolean;
}

export const outputSanitizerEnabled =
  (process.env.OUTPUT_SANITIZER_ENABLED ?? "true")
    .trim()
    .toLowerCase() !== "false";

const BLOCK_THRESHOLD = Number(
  process.env.OUTPUT_SANITIZER_BLOCK_THRESHOLD ?? "70",
);

const EMBEDDING_SIMILARITY_THRESHOLD = Number(
  process.env.OUTPUT_SANITIZER_SIMILARITY ?? "0.72",
);

const failOpen =
  (process.env.OUTPUT_SANITIZER_FAIL_OPEN ?? "false")
    .trim()
    .toLowerCase() === "true";

const SENSITIVE_REFERENCE_TEXTS = [
  "The response reveals confidential employee salary or payroll information.",
  "The response exposes a password, API key, secret, access token, or credential.",
  "The response reveals administrator login details or authentication secrets.",
  "The response exposes database passwords, cloud credentials, or production tokens.",
  "The response provides private employee information that must not be disclosed.",
  "The response reveals confidential company records containing actual sensitive values.",
] as const;

/** Regex patterns → risk score (ported conceptually from WRDN). */
const REGEX_RISK_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /\bpassword\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\badmin\s+password\s*[:=]?\s*\S+/i, score: 100 },
  { pattern: /\bapi\s*key\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\btoken\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\bsecret\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\bcredential\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /(?:sk|api|key|secret|token)[\-_][a-zA-Z0-9]{10,}/i, score: 100 },
  { pattern: /\bmanager\b[\s\S]{0,40}\bsalary\b[\s\S]{0,40}(?:rs\.?|lkr|\$)?\s*\d+/i, score: 100 },
  { pattern: /\bsalary\b[\s\S]{0,40}\bmanager\b[\s\S]{0,40}(?:rs\.?|lkr|\$)?\s*\d+/i, score: 100 },
  { pattern: /\bemployee\b[\s\S]{0,40}\bsalary\b[\s\S]{0,40}(?:rs\.?|lkr|\$)?\s*\d+/i, score: 95 },
  { pattern: /\bsalary\b[\s\S]{0,40}\bemployee\b[\s\S]{0,40}(?:rs\.?|lkr|\$)?\s*\d+/i, score: 95 },
  { pattern: /\bpayroll\b[\s\S]{0,30}\d+/i, score: 90 },
  { pattern: /select\s+.*salary.*\s+from/i, score: 90 },
  { pattern: /select\s+.*password.*\s+from/i, score: 100 },
  { pattern: /select\s+.*token.*\s+from/i, score: 100 },
  { pattern: /select\s+.*secret.*\s+from/i, score: 100 },
  { pattern: /select\s+.*api[_\s-]?key.*\s+from/i, score: 100 },
  { pattern: /\bemployee[_\s-]?data\b[\s\S]{0,40}\bsalary\b/i, score: 90 },
  { pattern: /\busers?\b[\s\S]{0,30}\bpassword\b/i, score: 100 },
  { pattern: /\badmin\b[\s\S]{0,30}\bpassword\b/i, score: 100 },
  { pattern: /\binternal database\b[\s\S]{0,60}\bpassword\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\binternal database\b[\s\S]{0,60}\bapi\s*key\s*[:=]\s*\S+/i, score: 100 },
  { pattern: /\bconfidential\b[\s\S]{0,40}\bsalary\s*[:=]?\s*\d+/i, score: 100 },
  // Demo secrets from WRDN seed (harmless if unused)
  { pattern: /admin@12345/i, score: 100 },
  { pattern: /sk-test-company-secret-key-999/i, score: 100 },
  { pattern: /db_pass_2026_secret/i, score: 100 },
  { pattern: /aws-root-secret-2026/i, score: 100 },
  { pattern: /vpn-company-pass/i, score: 100 },
  { pattern: /jwt-prod-token-123456/i, score: 100 },
];

let referenceEmbeddingsCache:
  | Array<{ text: string; values: number[] }>
  | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function redactSensitiveParts(raw: string): string {
  let output = raw;

  const redactions: Array<[RegExp, string]> = [
    [
      /((?:manager|employee)?\s*salary\s*(?:is|[:=])\s*)(?:rs\.?|lkr|\$)?\s*\d+(?:,\d{3})*(?:\.\d+)?/gi,
      "$1[BLOCKED]",
    ],
    [/\b(password\s*[:=]\s*)\S+/gi, "$1[BLOCKED]"],
    [/\b(api\s*key\s*[:=]\s*)\S+/gi, "$1[BLOCKED]"],
    [/\b(token\s*[:=]\s*)\S+/gi, "$1[BLOCKED]"],
    [/\b(secret\s*[:=]\s*)\S+/gi, "$1[BLOCKED]"],
    [/\b(credential\s*[:=]\s*)\S+/gi, "$1[BLOCKED]"],
  ];

  for (const [pattern, replacement] of redactions) {
    output = output.replace(pattern, replacement);
  }

  return output;
}

function regexOutputSanitizer(rawAiOutput: string): {
  blocked: boolean;
  risk_score: number;
  reason: string;
} {
  let highestScore = 0;
  const reasons: string[] = [];

  for (const { pattern, score } of REGEX_RISK_PATTERNS) {
    if (pattern.test(rawAiOutput)) {
      highestScore = Math.max(highestScore, score);
      reasons.push(`Matched pattern: ${pattern.source}`);
    }
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
  }

  return {
    blocked: highestScore >= BLOCK_THRESHOLD,
    risk_score: highestScore,
    reason: reasons.length
      ? reasons.join("; ")
      : "No regex risk detected in AI output.",
  };
}

async function createGeminiEmbedding(text: string): Promise<number[]> {
  const cleaned = text.trim();
  if (!cleaned) {
    throw new Error("Embedding input cannot be empty.");
  }

  const response = await gemini.models.embedContent({
    model: geminiEmbedModel,
    contents: cleaned,
  });

  const embeddings = response.embeddings;
  const first = embeddings?.[0];
  const values =
    first?.values ??
    (first as { embedding?: number[] } | undefined)?.embedding;

  if (!values?.length) {
    throw new Error("Gemini returned an empty embedding vector.");
  }

  return values.map((value) => Number(value));
}

async function getReferenceEmbeddings(): Promise<
  Array<{ text: string; values: number[] }>
> {
  if (referenceEmbeddingsCache) {
    return referenceEmbeddingsCache;
  }

  const pairs: Array<{ text: string; values: number[] }> = [];

  for (const text of SENSITIVE_REFERENCE_TEXTS) {
    pairs.push({
      text,
      values: await createGeminiEmbedding(text),
    });
  }

  referenceEmbeddingsCache = pairs;
  return pairs;
}

async function embeddingRiskCheck(rawAiOutput: string): Promise<{
  blocked: boolean;
  risk_score: number;
  similarity: number;
  matched_reference: string;
  reason: string;
  error: boolean;
}> {
  try {
    const outputEmbedding = await createGeminiEmbedding(rawAiOutput);
    const references = await getReferenceEmbeddings();

    let highestSimilarity = 0;
    let matchedReference = "";

    for (const reference of references) {
      const similarity = cosineSimilarity(
        outputEmbedding,
        reference.values,
      );

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        matchedReference = reference.text;
      }
    }

    const blocked = highestSimilarity >= EMBEDDING_SIMILARITY_THRESHOLD;
    const riskScore = blocked
      ? Math.max(
          BLOCK_THRESHOLD,
          Math.round(highestSimilarity * 100),
        )
      : Math.round(highestSimilarity * 100);

    return {
      blocked,
      risk_score: riskScore,
      similarity: Number(highestSimilarity.toFixed(4)),
      matched_reference: matchedReference,
      reason: blocked
        ? `Semantic similarity to sensitive enterprise output detected: ${matchedReference}`
        : "No high semantic similarity to sensitive output.",
      error: false,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown embedding error";

    console.error("[OutputSanitizer] embedding check failed:", message);

    return {
      blocked: true,
      risk_score: BLOCK_THRESHOLD,
      similarity: 0,
      matched_reference: "",
      reason: `Embedding sanitizer unavailable: ${message}`,
      error: true,
    };
  }
}

/**
 * Final output sanitizer — regex + Gemini embedding layers.
 */
export async function sanitizeAiOutput(
  rawAiOutput: string,
): Promise<SanitizeResult> {
  const text = rawAiOutput.trim();

  if (!text) {
    return {
      allowed: true,
      status: "ALLOWED",
      risk_score: 0,
      detection_layer: "Output Sanitizer",
      reason: "Empty output",
      final_output: text,
    };
  }

  if (!outputSanitizerEnabled) {
    return {
      allowed: true,
      status: "ALLOWED",
      risk_score: 0,
      detection_layer: "Output Sanitizer",
      reason: "Output sanitizer disabled",
      final_output: text,
    };
  }

  const regexResult = regexOutputSanitizer(text);
  const embeddingResult = await embeddingRiskCheck(text);

  if (embeddingResult.error && failOpen) {
    if (regexResult.blocked) {
      return {
        allowed: false,
        status: "BLOCKED",
        risk_score: regexResult.risk_score,
        detection_layer: "Regex Output Sanitizer",
        reason: regexResult.reason,
        final_output: redactSensitiveParts(text),
      };
    }

    return {
      allowed: true,
      status: "ALLOWED",
      risk_score: regexResult.risk_score,
      detection_layer: "Output Sanitizer",
      reason: `Embedding unavailable (fail-open). ${regexResult.reason}`,
      final_output: text,
    };
  }

  if (embeddingResult.error) {
    return {
      allowed: false,
      status: "ERROR",
      risk_score: BLOCK_THRESHOLD,
      detection_layer: "Embedding Sanitizer",
      reason: embeddingResult.reason,
      final_output:
        "[BLOCKED] The embedding sanitizer failed, so the output was not released.",
    };
  }

  const finalRiskScore = Math.max(
    regexResult.risk_score,
    embeddingResult.risk_score,
  );

  if (finalRiskScore >= BLOCK_THRESHOLD) {
    const useRegex = regexResult.risk_score >= embeddingResult.risk_score;

    return {
      allowed: false,
      status: "BLOCKED",
      risk_score: finalRiskScore,
      detection_layer: useRegex
        ? "Regex Output Sanitizer"
        : "Embedding Output Sanitizer",
      reason: useRegex ? regexResult.reason : embeddingResult.reason,
      final_output: redactSensitiveParts(text),
    };
  }

  return {
    allowed: true,
    status: "ALLOWED",
    risk_score: finalRiskScore,
    detection_layer: "Output Sanitizer",
    reason: "AI output passed regex and embedding checks.",
    final_output: text,
  };
}

export async function sanitizeNarrativeText(
  text: string | null | undefined,
  fallback = "Content withheld by output sanitizer.",
): Promise<string | null> {
  if (text == null) {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return trimmed;
  }

  const result = await sanitizeAiOutput(trimmed);

  if (result.status === "ALLOWED") {
    return result.final_output;
  }

  return fallback;
}

export async function sanitizeNarrativeList(
  values: string[],
  fallbackItem = "Item withheld by output sanitizer.",
): Promise<string[]> {
  if (values.length === 0) {
    return [];
  }

  const joined = values
    .map((value, index) => `${index + 1}. ${value}`)
    .join("\n");

  const result = await sanitizeAiOutput(joined);

  if (result.status !== "ALLOWED") {
    return [fallbackItem];
  }

  const lines = result.final_output
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0);

  return lines.length > 0 ? lines : values;
}
