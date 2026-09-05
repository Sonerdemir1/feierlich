"use client";

import type { CSSProperties, ReactNode } from "react";

// Umgebungsunabhaengiger Praesentations-Baustein (siehe Umsetzungsplan,
// Architektur-Entscheidung zu DesignStudio.tsx): reine Props rein/raus, kein
// eingebautes postMessage/fetch — die Elternkomponente (HeroCard.tsx im
// Dashboard-iframe) entscheidet, was "Auswahl" fachlich bedeutet und wie sie
// kommuniziert wird. So bleibt der Baustein spaeter 1:1 im Marketing-
// Customizer wiederverwendbar, der ohne iframe/postMessage direkt im
// selben React-Baum rendert.
//
// "kind" unterscheidet zwei Faelle: "text" umschliesst ein bereits selbst
// fokussierbares contentEditable-Element (InlineEditableText) — der Klick
// aufs Element selbst uebernimmt die Fokussierung, dieser Wrapper zeigt nur
// den Auswahl-Rahmen + Edit-Button obendrauf. "date" umschliesst reinen,
// nicht editierbaren Text (Datum darf kein Freitext sein) — hier macht der
// Wrapper selbst den ganzen Bereich klickbar, um z.B. ein Mini-Datumsformular
// zu oeffnen (Phase 3).
export function SelectableElement({
  children,
  selected,
  onSelect,
  kind,
  label,
  accentColor = "var(--gold, #B9975B)",
  style,
}: {
  children: ReactNode;
  selected: boolean;
  onSelect: () => void;
  kind: "text" | "date";
  label: string;
  accentColor?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{ position: "relative", display: "inline-block", cursor: kind === "date" ? "pointer" : undefined, ...style }}
      onClick={kind === "date" ? onSelect : undefined}
      role={kind === "date" ? "button" : undefined}
      tabIndex={kind === "date" ? 0 : undefined}
      onKeyDown={
        kind === "date"
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      aria-label={kind === "date" ? label : undefined}
    >
      {children}
      {selected && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -6,
              border: `1.5px dashed ${accentColor}`,
              borderRadius: 4,
              pointerEvents: "none",
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            title={`${label} bearbeiten`}
            aria-label={`${label} bearbeiten`}
            style={{
              position: "absolute",
              top: -14,
              right: -14,
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: `1px solid ${accentColor}`,
              background: "#fff",
              color: "#211C19",
              fontSize: 12,
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
            }}
          >
            ✎
          </button>
        </>
      )}
    </div>
  );
}
