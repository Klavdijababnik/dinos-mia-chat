import type { ChatMessage } from "@/lib/types";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export const MIA_MODEL = "mia";
export const DEFAULT_MIA_BASE_URL = "https://mia.mikrografija.si/dinos/v1";
export const MIN_MAX_TOKENS = 256;
export const DEFAULT_MAX_TOKENS = 4096;

type MiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MiaChoice = {
  message?: {
    content?: string | null;
    reasoning_content?: string | null;
  };
};

type MiaChatCompletion = {
  choices?: MiaChoice[];
};

export function resolveMaxTokens(): number {
  const parsed = Number(process.env.MIA_MAX_TOKENS);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.max(MIN_MAX_TOKENS, Math.trunc(parsed));
  }
  return DEFAULT_MAX_TOKENS;
}

export function resolveMiaBaseUrl(): string {
  return (process.env.MIA_BASE_URL || DEFAULT_MIA_BASE_URL).replace(/\/+$/, "");
}

export function buildMiaMessages(messages: ChatMessage[]): MiaMessage[] {
  return [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
}

export function extractAssistantContent(payload: MiaChatCompletion): string {
  const message = payload.choices?.[0]?.message;
  const content = typeof message?.content === "string" ? message.content.trim() : "";
  if (content) {
    return content;
  }
  // mIA may spend the budget on reasoning_content; surface a clear empty signal upstream
  const reasoning =
    typeof message?.reasoning_content === "string" ? message.reasoning_content.trim() : "";
  if (reasoning) {
    // Prefer not to show chain-of-thought; ask caller to retry with more tokens.
    // As last resort, if model never filled content, return a short Slovenian fallback
    // only when reasoning looks like it contains a finished answer paragraph.
    const paragraphs = reasoning.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    const last = paragraphs[paragraphs.length - 1] || "";
    if (last.length >= 80 && !/moram |naj |verjetno |morda /i.test(last.slice(0, 40))) {
      return last;
    }
  }
  return "";
}

export async function createMiaCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.MIKROGRAFIJA_DINOS_API_KEY;
  if (!apiKey) {
    throw new MiaConfigError("Strežnik ni nastavljen (manjka API ključ).");
  }

  const response = await fetch(`${resolveMiaBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MIA_MODEL,
      messages: buildMiaMessages(messages),
      max_tokens: resolveMaxTokens(),
    }),
  });

  if (!response.ok) {
    throw new MiaUpstreamError(
      "Pomočnik trenutno ni dosegljiv. Poskusite znova ali posredujte operaterju.",
    );
  }

  const payload = (await response.json()) as MiaChatCompletion;
  const content = extractAssistantContent(payload);
  if (!content) {
    throw new MiaUpstreamError("Odgovor je prazen. Poskusite znova.");
  }

  return content;
}

export class MiaConfigError extends Error {
  readonly status = 500;
}

export class MiaUpstreamError extends Error {
  readonly status = 502;
}
