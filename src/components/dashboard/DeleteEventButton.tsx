"use client";

import { useState } from "react";
import { deleteEvent } from "@/app/dashboard/events/actions";

// Staerkere Bestaetigung als DeleteGuestButton.tsx (nur ein confirm()-Dialog)
// — ein ganzes Event zu loeschen nimmt Gaesteliste, Zusagen, Fotos und
// Gaestebuch unwiderruflich mit, ein versehentlicher Klick waere deutlich
// teurer als beim Entfernen eines einzelnen Gasts. Tippen des exakten
// Event-Titels statt nur OK/Abbrechen, gleiches Prinzip wie z.B. GitHubs
// Repo-Loeschen.
export function DeleteEventButton({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const canDelete = typed === eventTitle;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ padding: "9px 16px", background: "none", border: "1px solid #B2543A", color: "#B2543A", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
      >
        Event löschen
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #B2543A55", borderRadius: 8, padding: "16px 18px", background: "#B2543A0d" }}>
      <p style={{ fontSize: 13, marginBottom: 10 }}>
        Das löscht <strong>{eventTitle}</strong> unwiderruflich — inklusive Gästeliste, Zusagen, Fotos, Gästebuch und
        allen weiteren Inhalten. Zahlungs-/Rechnungsdaten bleiben für die Buchhaltung erhalten.
      </p>
      <p style={{ fontSize: 12.5, marginBottom: 8, color: "var(--ink-soft)" }}>
        Zum Bestätigen den Event-Titel eintippen: <strong>{eventTitle}</strong>
      </p>
      <form action={deleteEvent.bind(null, eventId)} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="confirmTitle"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={eventTitle}
          autoComplete="off"
          style={{ flex: "1 1 220px", padding: "9px 12px", border: "1px solid #B2543A55", borderRadius: 6, fontSize: 13 }}
        />
        <button
          type="submit"
          disabled={!canDelete}
          style={{
            padding: "9px 16px",
            background: canDelete ? "#B2543A" : "#B2543A55",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: canDelete ? "pointer" : "not-allowed",
          }}
        >
          Endgültig löschen
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
          style={{ padding: "9px 16px", background: "none", border: "1px solid var(--line)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
        >
          Abbrechen
        </button>
      </form>
    </div>
  );
}
