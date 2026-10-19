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
  category,
  children,
}: {
  background: string;
  accent: string;
  primary: string;
  // Optional — steuert "Verspielt"/"Business Modern" gezielt auf ihre
  // eigenen Materialien statt auf die Farb-Heuristik (siehe
  // envelopeMaterialFor() in TemplateGallery.tsx). Faellt auf die reine
  // Farb-Heuristik zurueck, wenn eine Aufrufstelle sie (noch) nicht hat.
  category?: string;
  children: ReactNode;
}) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");

  // Redesign Nr. 4 (Nutzer-Feedback, woertlich: "da sind ueberall auf den
  // Smartphones die gleichen Siegel drauf... kein geiles Design"): das
  // generische wax-seal-dark/light.png (nur 2 Varianten fuer alle 50
  // Vorlagen) ist weg. Jedes der 7 Material-Fotos hat ein eigenes,
  // einzigartiges eingebackenes Siegel — material.seal ist ein zentrierter
  // Ausschnitt genau darum (siehe envelopeMaterialFor()/Kommentar dort).
  const material = envelopeMaterialFor({ background, accent, primary }, category);

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
              style={{ backgroundImage: `linear-gradient(165deg, ${background}3d, ${accent}21), url(${material.photo})`, borderColor: accent }}
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
              style={{ backgroundImage: `linear-gradient(165deg, ${accent}4d, ${background}30), url(${material.photo})`, borderColor: accent }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- echtes, einzigartiges Siegel-Foto pro Material, keine next/image-Optimierung noetig */}
            <img className="envelope-seal-img" src={material.seal} alt="" />
          </button>
          <div className="envelope-hint" style={{ color: primary }}>
            Zum Öffnen antippen
          </div>
        </>
      )}
      {/* Redesign Nr. 5 (Nutzer-Feedback, woertlich: "die Karten passen ja
          nicht wirklich dazu... wenn du da ein dunkelblau nimmst, dann
          muss die Karte auch dazu passen"): kraeftige Umschlag-Materialien
          (Marineblau-Samt etc.) trafen bisher hart auf die oft cremefarbene
          Kartenflaeche. .envelope-handoff liegt als Overlay (hoeherer
          z-index, mix-blend-mode statt Hintergrund) UEBER dem Karteninhalt
          und faerbt nur die obersten ~160px direkt am Oeffnungs-Nahtpunkt
          in material.tint ein, dann blendet es aus — eine Hintergrundfarbe
          auf .envelope-content selbst waere von Heros eigenem opaken
          Hintergrund komplett verdeckt gewesen. Kein Eingriff in die Karte
          selbst, nur ein weicher Farb-Handoff an der Naht. */}
      <div className="envelope-content">
        <div
          className="envelope-handoff"
          style={{ background: `linear-gradient(${material.tint}, ${material.tint}00)` }}
          aria-hidden="true"
        />
        {children}
      </div>
    </div>
  );
}
