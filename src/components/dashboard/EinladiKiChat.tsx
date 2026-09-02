"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { field: "title" | "subtitle" | "description"; value: string } | null;
type ChatMessage = { role: "user" | "assistant"; content: string; suggestion?: Suggestion };

const FIELD_LABELS: Record<string, string> = { title: "Titel", subtitle: "Untertitel", description: "Beschreibung" };

// Persistenter Chat-Assistent im Event-Dashboard — Verlauf liegt in der DB
// (EinladiKiMessage), daher beim Oeffnen erst laden statt nur lokalem State.
// "Uebernehmen" auf einem Textvorschlag nutzt dieselbe /inline-text-Route
// wie das Klick-Bearbeiten auf der Live-Vorschau (gleiche Feldmenge).
export function EinladiKiChat({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    fetch(`/dashboard/events/${eventId}/einladi-ki`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded, eventId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetch(`/dashboard/events/${eventId}/einladi-ki`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (res.status === 429) {
        setError("Kontingent an Nachrichten für dieses Event ist aufgebraucht.");
      } else if (!res.ok) {
        setError("Einladi KI ist gerade nicht erreichbar. Bitte später erneut versuchen.");
      } else {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, suggestion: data.suggestion }]);
      }
    } catch {
      setError("Einladi KI ist gerade nicht erreichbar. Bitte später erneut versuchen.");
    } finally {
      setSending(false);
    }
  }

  async function handleApply(index: number, suggestion: NonNullable<Suggestion>) {
    setApplying(index);
    try {
      const res = await fetch(`/dashboard/events/${eventId}/inline-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: suggestion.field, value: suggestion.value }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, suggestion: null } : m)));
        router.refresh();
      }
    } finally {
      setApplying(null);
    }
  }

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 40 }}>
      {open && (
        <div
          className="card"
          style={{
            width: 340,
            maxWidth: "calc(100vw - 40px)",
            height: 480,
            maxHeight: "calc(100vh - 100px)",
            display: "flex",
            flexDirection: "column",
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>✦ Einladi KI</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Schließen"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", fontSize: 16, padding: 4 }}
            >
              ✕
            </button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {loaded && messages.length === 0 && (
              <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
                Frag mich zum Stand deines Events oder lass dir Titel, Untertitel oder Beschreibung vorschlagen — z. B.
                „Wie viele haben zugesagt?“ oder „Schreib mir einen Untertitel“.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "8px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    background: m.role === "user" ? "var(--terracotta)" : "var(--ivory-2)",
                    color: m.role === "user" ? "#fff" : "var(--ink)",
                  }}
                >
                  {m.content}
                </div>
                {m.suggestion && (
                  <div
                    style={{
                      maxWidth: "88%",
                      marginTop: 6,
                      border: "1px solid var(--line)",
                      background: "var(--ivory)",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 4 }}>
                      Vorschlag: {FIELD_LABELS[m.suggestion.field]}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink)", marginBottom: 8 }}>{m.suggestion.value}</div>
                    <button
                      type="button"
                      onClick={() => handleApply(i, m.suggestion!)}
                      disabled={applying === i}
                      className="btn btn-primary"
                      style={{ padding: "6px 12px", fontSize: 11.5 }}
                    >
                      {applying === i ? "Übernimmt…" : "Übernehmen"}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {sending && <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Einladi KI schreibt…</div>}
            {error && <div style={{ fontSize: 12, color: "#B2543A" }}>{error}</div>}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8, flexShrink: 0 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nachricht an Einladi KI…"
              style={{ flex: 1, padding: "9px 12px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="btn btn-primary"
              style={{ padding: "9px 14px", fontSize: 12.5 }}
            >
              Senden
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "var(--ink)",
          color: "var(--ivory)",
          border: "none",
          cursor: "pointer",
          fontSize: 20,
          boxShadow: "var(--shadow-md)",
          marginLeft: "auto",
          display: "block",
        }}
        aria-label="Einladi KI öffnen"
      >
        {open ? "✕" : "✦"}
      </button>
    </div>
  );
}
