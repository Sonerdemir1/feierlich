"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type EnvelopeRevealProps = {
  images: string[];
  stepDuration?: number;
  children?: ReactNode;
  // Zoomt gezielt in das letzte Bild (die aufgedeckte Karte) hinein, damit
  // die leere Kartenflaeche mehr vom Rahmen einnimmt und der Text-Slot
  // nicht mit Umschlag/Blumen/Siegel drumherum konkurriert. finalFocusX/Y
  // ist der Punkt im Quellbild (0-100, Prozent von Breite/Hoehe), der nach
  // dem Zoom im Zentrum des Rahmens landen soll — je nach Asset
  // unterschiedlich, daher pro Vorlage konfigurierbar statt hartcodiert.
  //
  // Bewusst NICHT ueber object-position gel​oest: bei exakt gleichem
  // Seitenverhaeltnis von Bild und Rahmen (hier beides 2:3) beschneidet
  // object-fit:cover nichts, object-position haette also gar keine
  // Wirkung. Stattdessen wird das <img> selbst um den Zoom-Faktor
  // ueberdimensioniert und per left/top-Prozent so verschoben, dass der
  // gewuenschte Fokuspunkt exakt in der Rahmenmitte landet (klassische
  // Pan-&-Zoom-Technik).
  finalZoom?: number;
  finalFocusX?: number;
  finalFocusY?: number;
};

// Spielt eine beliebig lange Bild-Sequenz (z.B. Umschlag zu -> Siegel offen
// -> Umschlag offen -> Karte kommt raus -> Karte sichtbar -> finale Karte)
// per Klick als Crossfade-Kette ab. Das letzte Bild bleibt stehen und traegt
// den children-Text-Slot (Name/Datum). Kein drittes Sequenz-Array fuer die
// Animation selbst noetig — nur ein Index, der stufenweise hochgezaehlt wird.
//
// prefers-reduced-motion wird per matchMedia() geprueft (nicht per reiner
// CSS-Media-Query wie bei HeroLuxe/der vorigen EnvelopeReveal-Fassung),
// weil die Sequenz-Steuerung selbst zeitgesteuert per JS laeuft (setTimeout
// pro Schritt) — bei reduzierter Bewegung ueberspringt der Klick-Handler
// die Kette komplett und springt direkt zum letzten Bild.
export function EnvelopeReveal({
  images,
  stepDuration = 550,
  children,
  finalZoom = 1,
  finalFocusX = 50,
  finalFocusY = 50,
}: EnvelopeRevealProps) {
  const [step, setStep] = useState(0);
  // Wird nur beim Start einmal ermittelt (reduced-motion oder Ein-Bild-Fall)
  // und schaltet Transitions komplett ab — nicht nur fuer den Sprung selbst,
  // sonst wuerde ausgerechnet das letzte (dann sofort sichtbare) Bild noch
  // per CSS-transition einblenden.
  const [instant, setInstant] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndex = images.length - 1;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleStart() {
    if (step !== 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || images.length <= 1) {
      setInstant(true);
      setStep(lastIndex);
      return;
    }

    function advance(next: number) {
      setStep(next);
      if (next < lastIndex) {
        timeoutRef.current = setTimeout(() => advance(next + 1), stepDuration);
      }
    }
    advance(1);
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      aria-disabled={step !== 0}
      aria-label="Umschlag öffnen"
      aria-live="polite"
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: "2 / 3",
        padding: 0,
        border: "none",
        background: "none",
        cursor: step === 0 ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      {images.map((src, i) => {
        const isFinal = i === lastIndex;
        const zoom = isFinal ? finalZoom : 1;
        // left/top so berechnet, dass (finalFocusX, finalFocusY) im
        // Quellbild nach der Vergroesserung exakt im Zentrum des Rahmens
        // liegt: left% + fokusX% * zoom = 50% (Herleitung siehe Kommentar
        // oben an der Prop-Definition).
        const left = zoom === 1 ? 0 : 50 - finalFocusX * zoom;
        const top = zoom === 1 ? 0 : 50 - finalFocusY * zoom;
        return (
          // eslint-disable-next-line @next/next/no-img-element -- Vorlagen-Asset, keine next/image-Optimierung noetig
          <img
            key={src}
            src={src}
            alt=""
            style={{
              position: "absolute",
              width: `${zoom * 100}%`,
              height: `${zoom * 100}%`,
              left: `${left}%`,
              top: `${top}%`,
              objectFit: "cover",
              opacity: i === step ? 1 : 0,
              transition: instant ? "none" : `opacity ${stepDuration}ms ease`,
            }}
          />
        );
      })}

      {step === lastIndex && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      )}
    </button>
  );
}
