"use client";

import { useState, type ReactNode } from "react";

// Generische, CSS-animierte Umschlag-Oeffnung fuer alle Vorlagen ohne eigene
// Bildsequenz (siehe EnvelopeReveal.tsx fuer die 15 Duegduen-Blanko-Vorlagen
// mit echter Umschlag-Fotografie) — Farben kommen direkt von der Vorlage,
// kein neues Artwork pro Design noetig.
//
// Bugfix/Redesign (docs/MOTION.md §3, Referenz-Studie thedigitalyes.com):
// die vorherige Fassung war ein einzelner Flap mit einem generischen Herz-
// SVG als "Siegel" (woertlicher Kunden-Kommentar dazu stand hier: "wir sind
// Welten davon entfernt"). Jetzt: zwei Tuerfluegel-Haelften, die auseinander-
// schieben, ein warmer Lichtschimmer im wachsenden Spalt, und ein echtes
// fotografiertes Wachssiegel (siehe public/assets/seals/), das bis zuletzt
// sichtbar bleibt und erst im letzten Drittel der Bewegung verblasst — "ein
// kleines Theaterstueck" statt Fade/Flap.
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

  // Siegel-Farbvariante aus der Helligkeit der Vorlagenfarbe ableiten (keine
  // zusaetzliche Prop noetig) — relative Luminanz, W3C-Naeherung. Dunkle
  // Vorlagen (Jewel-Tones, Statement-Kategorie) bekommen das helle Siegel
  // als Kontrast, helle Vorlagen das dunkle, damit es nie auf der eigenen
  // Flaeche verschwindet.
  const sealSrc = isLight(background) ? "/assets/seals/wax-seal-dark.png" : "/assets/seals/wax-seal-light.png";

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
    setTimeout(() => setPhase("open"), 820);
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
            <div className="envelope-body" style={{ background: `linear-gradient(135deg, ${background}, ${accent}22)`, borderColor: accent }} />
            <div className="envelope-glow" style={{ background: `radial-gradient(circle, ${accent}cc 0%, transparent 70%)` }} />
            <div
              className="envelope-panel envelope-panel-left"
              style={{ background: `linear-gradient(135deg, ${background}, ${accent}22)`, borderColor: accent }}
            />
            <div
              className="envelope-panel envelope-panel-right"
              style={{ background: `linear-gradient(135deg, ${background}, ${accent}22)`, borderColor: accent }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- kleines statisches Deko-Asset, keine next/image-Optimierung noetig */}
            <img className="envelope-seal-img" src={sealSrc} alt="" />
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

// Relative Luminanz (W3C-Naeherung, ausreichend fuer diese Ja/Nein-
// Entscheidung) aus einem #rrggbb-Hex-Wert. Nicht-Hex-Werte (sollte bei
// Vorlagenfarben nicht vorkommen) fallen auf "hell" zurueck.
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
