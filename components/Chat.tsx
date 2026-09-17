"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { EscalateDialog } from "@/components/EscalateDialog";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Kaj je DROE in koga zadeva?",
  "Kako prijavim odpadno embalažo?",
  "Kdaj naj se obrnem na operaterja?",
];

type ChatProps = {
  operatorEmail: string;
};

export function Chat({ operatorEmail }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(content: string) {
    const trimmed = content.trim();
    if (!trimmed || loading) {
      return;
    }

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
          <h1>Pomočnik za odpadno embalažo</h1>
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
              <li key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                <span className="who">{message.role === "user" ? "Vi" : "Pomočnik"}</span>
                <p>{message.content}</p>
              </li>
            ))}
            {loading ? (
              <li className="bubble assistant pending">
                <span className="who">Pomočnik</span>
                <p>Pripravljam odgovor…</p>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      {error ? <p className="error">{error}</p> : null}

      <form className="composer" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Vpišite vprašanje
        </label>
        <textarea
          id="chat-input"
          rows={2}
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

      <EscalateDialog
        open={escalateOpen}
        operatorEmail={operatorEmail}
        messages={messages}
        onClose={() => setEscalateOpen(false)}
      />
    </div>
  );
}
