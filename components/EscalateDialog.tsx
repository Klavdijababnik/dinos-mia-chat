"use client";

import { useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types";

type EscalateDialogProps = {
  open: boolean;
  operatorEmail: string;
  messages: ChatMessage[];
  onClose: () => void;
};

export function EscalateDialog({
  open,
  operatorEmail,
  messages,
  onClose,
}: EscalateDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const transcript = useMemo(() => {
    if (messages.length === 0) {
      return "(še ni sporočil)";
    }

    return messages
      .map((message) => {
        const who = message.role === "user" ? "Uporabnik" : "Pomočnik";
        return `${who}: ${message.content}`;
      })
      .join("\n\n");
  }, [messages]);

  if (!open) {
    return null;
  }

  const subject = encodeURIComponent("DINOS chat — posredovanje operaterju");
  const body = encodeURIComponent(
    [
      `Ime: ${name || "(ni navedeno)"}`,
      `E-pošta: ${email || "(ni navedeno)"}`,
      "",
      "Opomba:",
      note || "(ni opombe)",
      "",
      "Pogovor:",
      transcript,
    ].join("\n"),
  );

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="escalate-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="escalate-title">Posreduj operaterju</h2>
        <p>
          Odpre se e-pošta na {operatorEmail}. Sporočilo vključuje izpis pogovora.
          V prvi različici to še ni vstopnica v CRM.
        </p>

        <label>
          Ime
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </label>

        <label>
          E-pošta
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label>
          Opomba za operaterja
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Prekliči
          </button>
          <a className="primary-button" href={`mailto:${operatorEmail}?subject=${subject}&body=${body}`}>
            Odpri e-pošto
          </a>
        </div>
      </div>
    </div>
  );
}
