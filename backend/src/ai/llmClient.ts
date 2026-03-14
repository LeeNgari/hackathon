import {
  buildGradingSystemPrompt,
  buildGradingUserPrompt,
  buildTicketGenerationSystemPrompt,
  buildTicketGenerationUserPrompt,
} from "./prompts.js";
import type {
  GradingContext,
  GradingResult,
  GeneratedTicket,
  TicketGenerationContext,
} from "./types.js";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface OpenRouterChatRequest {
  model: string;
  messages: ChatMessage[];
  response_format?: { type: "json_object" };
  max_tokens?: number;
  temperature?: number;
}

interface OpenRouterChatResponse {
  choices: {
    message: {
      content: string | null;
    };
  }[];
}

function getEnv(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env[name]) {
    return process.env[name];
  }
  return undefined;
}

/** Thrown when OpenRouter returns a non-2xx status (e.g. 429 rate limit). */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

async function callOpenRouter<T>(
  body: OpenRouterChatRequest,
): Promise<T> {
  const apiKey = getEnv("OPENROUTER_API_KEY");
  const base =
    getEnv("OPENROUTER_BASE_URL")?.replace(/\/$/, "") ??
    "https://openrouter.ai/api/v1";
  const chatUrl = base.endsWith("chat/completions")
    ? base
    : `${base}/chat/completions`;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set in the environment.",
    );
  }

  const res = await fetch(chatUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new OpenRouterError(
      `OpenRouter request failed (${res.status}): ${text}`,
      res.status,
    );
  }

  let json: OpenRouterChatResponse;
  try {
    json = JSON.parse(text) as OpenRouterChatResponse;
  } catch {
    const snippet = text.trimStart().slice(0, 200);
    throw new Error(
      `OpenRouter returned non-JSON (e.g. HTML error page). Status: ${res.status}. First 200 chars: ${snippet}`,
    );
  }

  const choices = json.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    const snippet = text.slice(0, 500);
    throw new Error(
      `OpenRouter response missing choices array. Response: ${snippet}`,
    );
  }
  const content = choices[0]?.message?.content;
  if (!content) {
    const snippet = text.slice(0, 500);
    throw new Error(
      `OpenRouter response had no message content. Response: ${snippet}`,
    );
  }

  try {
    return JSON.parse(content) as T;
  } catch (err) {
    const recovered = tryRecoverTicketArrayJson(content);
    if (recovered !== null) {
      return recovered as T;
    }
    throw new Error(
      `Failed to parse OpenRouter JSON response: ${(err as Error).message}\nRaw content:\n${content}`,
    );
  }
}

/** Try to salvage truncated ticket JSON by finding the last complete ticket and closing the array/object. */
function tryRecoverTicketArrayJson(content: string): { tickets: GeneratedTicket[] } | null {
  // Match end of a ticket: deliverables array closed ], then ticket object closed }, with optional trailing comma
  const ticketEndRegex = /\}\s*\]\s*\}\s*,?\s*/g;
  let lastMatch: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = ticketEndRegex.exec(content)) !== null) {
    lastMatch = m;
  }
  if (!lastMatch) return null;
  const truncated = content.slice(0, lastMatch.index + lastMatch[0].length).replace(/,\s*$/, "") + "\n  ]}\n";
  try {
    const parsed = JSON.parse(truncated) as { tickets?: unknown[] };
    if (parsed && Array.isArray(parsed.tickets) && parsed.tickets.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[callOpenRouter] Recovered ${parsed.tickets.length} ticket(s) from truncated JSON (response was cut off).`,
      );
      return { tickets: parsed.tickets as GeneratedTicket[] };
    }
  } catch {
    // ignore
  }
  return null;
}

function validateGradingResult(value: unknown): value is GradingResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.overallScore !== "number" || o.overallScore < 0 || o.overallScore > 100)
    return false;
  if (typeof o.overallFeedback !== "string") return false;
  if (!Array.isArray(o.perDeliverable)) return false;
  for (const p of o.perDeliverable as unknown[]) {
    if (!p || typeof p !== "object") return false;
    const item = p as Record<string, unknown>;
    if (typeof item.deliverableId !== "string") return false;
    if (typeof item.score !== "number" || item.score < 0 || item.score > 100) return false;
    if (typeof item.feedback !== "string") return false;
  }
  return true;
}

const GRADING_RETRIES = 2;
const GRADING_RETRY_DELAY_MS = 1500;

export async function gradeSubmission(
  context: GradingContext,
): Promise<GradingResult> {
  const systemPrompt = buildGradingSystemPrompt();
  const userPrompt = buildGradingUserPrompt(context);

  const model =
    getEnv("OPENROUTER_MODEL_GRADING") ??
    getEnv("OPENROUTER_MODEL") ??
    "openrouter/free";

  type GradingResponse = GradingResult;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= GRADING_RETRIES; attempt++) {
    try {
      const result = await callOpenRouter<GradingResponse>({
        model,
        response_format: { type: "json_object" },
        max_tokens: 1_500,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      if (!validateGradingResult(result)) {
        throw new Error(
          "Invalid grading response shape: expected overallScore (0-100), overallFeedback (string), perDeliverable (array of { deliverableId, score, feedback }).",
        );
      }
      return result as GradingResult;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        attempt < GRADING_RETRIES &&
        (lastError.message.includes("failed (5") ||
          lastError.message.includes("OpenRouter") ||
          lastError.message.includes("network") ||
          lastError.message.includes("fetch"));
      if (!isRetryable) throw lastError;
      await new Promise((r) => setTimeout(r, GRADING_RETRY_DELAY_MS));
    }
  }
  throw lastError ?? new Error("Grading failed after retries.");
}

const TICKET_GEN_RETRIES = 3;
const TICKET_GEN_RETRY_DELAY_MS = 2000;

export async function generateTicketsForCourse(
  context: TicketGenerationContext,
): Promise<GeneratedTicket[]> {
  const systemPrompt = buildTicketGenerationSystemPrompt();
  const userPrompt = buildTicketGenerationUserPrompt(context);

  const model =
    getEnv("OPENROUTER_MODEL_TICKETS") ??
    getEnv("OPENROUTER_MODEL") ??
    "openrouter/free";

  type TicketArrayResponse = {
    tickets: GeneratedTicket[];
  };

  const body: OpenRouterChatRequest = {
    model,
    response_format: { type: "json_object" },
    max_tokens: 12_000,
    temperature: 0.5,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= TICKET_GEN_RETRIES; attempt++) {
    try {
      const result = await callOpenRouter<TicketArrayResponse>(body);
      return Array.isArray(result.tickets) ? result.tickets : [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRateLimit =
        err instanceof OpenRouterError && err.status === 429;
      if (!isRateLimit || attempt >= TICKET_GEN_RETRIES) {
        throw lastError;
      }
      const delayMs = TICKET_GEN_RETRY_DELAY_MS * Math.pow(2, attempt);
      // eslint-disable-next-line no-console
      console.warn(
        `[generateTicketsForCourse] Rate limited (429), retrying in ${delayMs}ms (attempt ${attempt + 1}/${TICKET_GEN_RETRIES})`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError ?? new Error("Ticket generation failed after retries.");
}

