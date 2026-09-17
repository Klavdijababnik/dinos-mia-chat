import type { ChatMessage } from "@/lib/types";

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 8000;

export function sanitizeChatMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) {
    return null;
  }

  const sanitized: ChatMessage[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const role = "role" in item ? item.role : null;
    const content = "content" in item ? item.content : null;

    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      continue;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      continue;
    }

    sanitized.push({
      role,
      content: trimmed.slice(0, MAX_CONTENT_LENGTH),
    });
  }

  if (sanitized.length === 0) {
    return null;
  }

  return sanitized.slice(-MAX_MESSAGES);
}
