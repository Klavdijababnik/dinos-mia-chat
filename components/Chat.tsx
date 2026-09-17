"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EscalateDialog } from "@/components/EscalateDialog";
import { SafeMarkdown } from "@/components/SafeMarkdown";
import type { ChatMessage } from "@/lib/types";
import { useAppHeight } from "@/hooks/useAppHeight";

const SUGGESTIONS = [
  "Kaj je DROE in koga zadeva?",
  "Kako prijavim odpadno embalažo?",
  "Kdaj naj se obrnem na operaterja?",
];

type ChatProps = {
  operatorEmail: string;
};

type ScrollIntent = { index: number; block: ScrollLogicalPosition } | null;

export function Chat({ operatorEmail }: ChatProps) {
  useAppHeight();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const pendingRef = useRef<HTMLLIElement | null>(null);
  const scrollIntentRef = useRef<ScrollIntent>(null);

  useEffect(() => {
    const intent = scrollIntentRef.current;
    if (!intent) return;
    scrollIntentRef.current = null;

    const el =
      intent.index === -1
        ? pendingRef.current
        : messageRefs.current.get(intent.index);

    if (!el) return;

    // Keep scroll inside .transcript; auto (not smooth) so we don't fight the user.
    el.scrollIntoView({ block: intent.block, behavior: "auto", inline: "nearest" });
  }, [messages, loading]);

  function setMessageRef(index: number, node: HTMLLIElement | null) {
    if (node) {
      messageRefs.current.set(index, node);
    } else {
      messageRefs.current.delete(index);
    }
  }

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) {
      return;
    }

    const userIndex = messages.length;
    scrollIntentRef.current = { index: userIndex, block: "end" };

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const raw = await response.text();
      let payload: { message?: ChatMessage; error?: string } = {};
      try {
        payload = raw ? (JSON.parse(raw) as { message?: ChatMessage; error?: string }) : {};
      } catch {
        throw new Error(
          response.ok
            ? "Strežnik je vrnil neveljaven odgovor. Poskusite znova."
            : "Povezava do pomočnika trenutno ni zanesljiva. Poskusite znova čez trenutek.",
        );
      }

      if (!response.ok || !payload.message?.content) {
        throw new Error(
          payload.error ||
            (response.status >= 500
              ? "Pomočnik trenutno ne more odgovoriti. Poskusite znova."
              : "Pošiljanje ni uspelo."),
        );
      }

      const assistantIndex = nextMessages.length;
      scrollIntentRef.current = { index: assistantIndex, block: "start" };
      setMessages((current) => [...current, payload.message as ChatMessage]);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Prišlo je do napake. Poskusite znova.";
      // Safari: JSON.parse on HTML often throws "The string did not match the expected pattern."
      setError(
        /expected pattern|JSON|Unexpected token/i.test(message)
          ? "Povezava do pomočnika trenutno ni zanesljiva. Poskusite znova čez trenutek."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">DINOS · DROE</p>
          <h1>
            <span className="title-full">Pomočnik za odpadno embalažo</span>
            <span className="title-compact">Pomočnik DROE</span>
          </h1>
        </div>
        <button type="button" className="ghost-button" onClick={() => setEscalateOpen(true)}>
          Posreduj operaterju
        </button>
      </header>

      <DisclaimerBanner />

      <div className="transcript" ref={listRef} aria-live="polite">
        {messages.length === 0 && !loading ? (
          <div className="empty">
            <p>
              Vprašajte o odpadni embalaži, obveznostih DROE ali postopkih pri DINOS.
              Odgovori temeljijo na virih Mikrografija mIA.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chip"
                  onClick={() => void sendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="messages">
            {messages.map((message, index) => (
              <li
                key={`${message.role}-${index}`}
                className={`bubble ${message.role}`}
                ref={(node) => setMessageRef(index, node)}
              >
                <span className="who">{message.role === "user" ? "Vi" : "Pomočnik"}</span>
                {message.role === "assistant" ? (
                  <SafeMarkdown content={message.content} />
                ) : (
                  <p>{message.content}</p>
                )}
              </li>
            ))}
            {loading ? (
              <li className="bubble assistant pending" ref={pendingRef}>
                <span className="who">Pomočnik</span>
                <p>Pripravljam odgovor…</p>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      <div className="footer-area">
        {error ? <p className="error">{error}</p> : null}

        <form className="composer" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="chat-input">
            Vpišite vprašanje
          </label>
          <textarea
            id="chat-input"
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Vpišite vprašanje o odpadni embalaži…"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <button type="submit" className="primary-button" disabled={loading || !input.trim()}>
            Pošlji
          </button>
        </form>
      </div>

      <EscalateDialog
        open={escalateOpen}
        operatorEmail={operatorEmail}
        messages={messages}
        onClose={() => setEscalateOpen(false)}
      />
    </div>
  );
}
