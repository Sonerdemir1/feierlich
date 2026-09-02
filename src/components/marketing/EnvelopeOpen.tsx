"use client";

import { useState, type ReactNode } from "react";

// Generische, CSS-animierte Umschlag-Oeffnung fuer alle Vorlagen ohne
// eigene Bildsequenz (siehe EnvelopeReveal.tsx fuer das eine Template mit
// echter Umschlag-Fotografie) — Farben kommen direkt von der Vorlage, kein
// neues Artwork pro Design noetig. Kunden-Feedback: "die Karten sind
// animiert, Umschlag geht animiert auf, wir sind Welten davon entfernt".
export function EnvelopeOpen({
  background,
  accent,
  primary,
  children,
}: {
  background: string;
  accent: string;
  primary: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  // reduced-motion wird erst beim Klick geprueft (gleiches Muster wie
  // EnvelopeReveal.tsx) statt in einem Mount-Effect — kein SSR/Hydration-
  // Sonderfall noetig, der Umschlag bleibt bis zur Interaktion sichtbar,
  // nur die Bewegung selbst wird uebersprungen.
  function handleOpen() {
    if (phase !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("open");
      return;
    }
    setPhase("opening");
    setTimeout(() => setPhase("open"), 700);
  }

  return (
    <div className={`envelope-wrap${phase === "open" ? " is-open" : ""}`}>
      {phase !== "open" && (
        <>
          <button
            type="button"
            className={`envelope-box${phase === "opening" ? " is-opening" : ""}`}
            onClick={handleOpen}
            aria-label="Umschlag öffnen"
          >
            <div className="envelope-body" style={{ background, borderColor: accent }} />
            <div className="envelope-flap" style={{ background: accent }} />
            <div className="envelope-seal" style={{ background: accent, color: background }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21s-7.5-4.6-10-9.3C.3 7.9 2 4 6 4c2.4 0 3.8 1.3 6 4 2.2-2.7 3.6-4 6-4 4 0 5.7 3.9 4 7.7C19.5 16.4 12 21 12 21z" />
              </svg>
            </div>
          </button>
          <div className="envelope-hint" style={{ color: primary }}>
            Zum Öffnen antippen
          </div>
        </>
      )}
      <div className="envelope-content">{children}</div>
    </div>
  );
}
