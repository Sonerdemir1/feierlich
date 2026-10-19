"use client";

import { useState, type ReactNode } from "react";
import { envelopeMaterialFor } from "@/components/marketing/TemplateGallery";

// Generische, CSS-animierte Umschlag-Oeffnung fuer alle Vorlagen ohne eigene
// Bildsequenz (siehe EnvelopeReveal.tsx fuer die 15 Duegduen-Blanko-Vorlagen
// mit echter Umschlag-Fotografie).
//
// Redesign Nr. 3 (Nutzer-Feedback, woertlich: "allein der Umschlag ist ja
// schon haesslich... sieht aus wie eine billige, cleane Wand"): Koerper und
// Lasche waren bis hierhin ein reiner CSS-Farbverlauf — strukturell schon
// ein echter Umschlag (siehe Redesign Nr. 2 unten), aber ohne jede
// Material-Haptik. Jetzt per envelopeMaterialFor() (TemplateGallery.tsx)
// eines von 7 KI-generierten Umschlag-Material-Fotos (gefaltete Seide/
// Samt/Leinen, siehe public/assets/envelope-materials/) als Flaeche,
// anhand der Vorlagenfarbe ausgewaehlt — dieselbe Funktion wie beim Handy-
// Mockup in der Galerie, damit Katalog-Vorschau und echte Oeffnung
// zueinander passen (CLAUDE.md Regel 6).
//
// Redesign Nr. 2 (Nutzer-Feedback, woertlich: "das darf nicht wie
// Schiebetueren aufgehen, das muss wie ein echter Umschlag aufgehen").
// Die vorherige Fassung (zwei seitlich auseinanderschiebende Tuerfluegel)
// wirkte wie zwei Tueren, nicht wie ein Umschlag. Recherche zur Referenz
// thedigitalyes.com ergab: deren Standard-Effekt (90% aller Einladungen,
// laut eigenem Blog) ist zweiphasig — "das Siegel bricht, der Umschlag
// entfaltet sich". Genau dieses Muster gab es im Projekt schon, nur nicht
// hier: MotionHero.tsx/.motion-flap im Startseiten-Hero nutzt bereits eine
// oben angeschlagene Dreiecks-Lasche (clip-path) mit echtem 3D-rotateX,
// plus einen Siegel-"Pop" (Skalieren+Rotieren+Verblassen). Diese bewaehrte
// Technik jetzt auch hier, statt der Tuerfluegel: Siegel poppt zuerst weg,
// kurz danach klappt die Lasche per rotateX nach hinten auf — fuehlt sich
// wie eine echte Umschlagklappe an statt wie eine Schiebetuer.
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
  const materialPhoto = envelopeMaterialFor({ background, accent, primary });

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
    setTimeout(() => setPhase("open"), 920);
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
            <div
              className="envelope-body"
              style={{ backgroundImage: `linear-gradient(165deg, ${background}3d, ${accent}21), url(${materialPhoto})`, borderColor: accent }}
            />
            <div className="envelope-glow" style={{ background: `radial-gradient(circle, ${accent}cc 0%, transparent 70%)` }} />
            {/* Oben angeschlagene Dreiecks-Lasche (clip-path), klappt per
                rotateX nach hinten auf — siehe Kommentar oben, dieselbe
                Technik wie .motion-flap im Startseiten-Hero. Etwas
                dunklerer Verlauf als der Koerper (accent staerker
                gewichtet), damit die Falz-Kante trotz identischem Foto
                sichtbar bleibt — wie bei einer echten Lasche, die das
                Licht anders faengt als die Flaeche darunter. */}
            <div
              className="envelope-flap"
              style={{ backgroundImage: `linear-gradient(165deg, ${accent}4d, ${background}30), url(${materialPhoto})`, borderColor: accent }}
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
