"use client";

import type { CSSProperties, ReactNode } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { EditableText, type TextField } from "./EditableText";
import type { IvColors, ClickField } from "./types";

// Randloser Foto-Hero + dreispaltige Meta-Zeile (Ort | Namen | Datum),
// Belle-Vorbild (siehe Plan). Ort/Datum sind Klick-Felder (oeffnen ein
// Mini-Formular im Panel, wie im bisherigen .customizer-card-Kopfbereich),
// keine freien Texteingaben.
export function Hero({
  photoUrl,
  colors,
  fontFamily,
  fontStyle = "normal",
  eventLabel,
  title,
  location,
  date,
  editable = true,
  eventLabelPlaceholder = "Hochzeitseinladung",
  eventLabelToolbar,
  titleToolbar,
}: {
  photoUrl?: string;
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  eventLabel: TextField;
  title: TextField;
  location: ClickField;
  date: ClickField;
  editable?: boolean;
  // Fuer nicht-Hochzeits-Veranstaltungsarten (Verlobung, Kına, ...) auf der
  // echten Event-Seite — dort ist der Anlass bekannt, auch bevor der
  // Gastgeber selbst ein Label eintraegt (siehe EventHero.tsx). Gestalten
  // kennt keinen echten Anlass vorab, bleibt beim generischen Standardwert.
  eventLabelPlaceholder?: string;
  // Kontext-Toolbar (ElementToolbar.tsx) — nur EventHero.tsx (echte Seite)
  // uebergibt diese, Gestalten (DesignStudio.tsx) bleibt unveraendert ohne.
  eventLabelToolbar?: ReactNode;
  titleToolbar?: ReactNode;
}) {
  const bandStyle: CSSProperties = {
    ["--iv-band-from" as string]: colors.accent,
    ["--iv-band-to" as string]: colors.primary,
    ...(photoUrl
      ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {}),
  };

  return (
    <div className="iv-band iv-hero" style={bandStyle}>
      <div className="iv-band-content iv-inner iv-hero-content">
        <EditableText
          field={eventLabel}
          editable={editable}
          as="span"
          label="Anlass-Label"
          placeholder={eventLabelPlaceholder}
          style={{ display: "block", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.85 }}
          toolbar={eventLabelToolbar}
        />
        <EditableText
          field={title}
          editable={editable}
          as="h1"
          label="Titel (Namen)"
          placeholder="Anna & Lukas"
          className="iv-hero-title"
          style={{ fontFamily, fontStyle }}
          accentColor="#fff"
          toolbar={titleToolbar}
        />
        <div className="iv-hero-meta">
          {/* Nutzer-Feedback: Namen standen hier nochmal, direkt unter dem
              bereits riesigen Titel mit denselben Namen — wirkte redundant
              ("Anna & Lukas" zweimal untereinander). Meta-Zeile jetzt nur
              noch Ort | Datum, ein Trenner statt zwei. */}
          {editable ? (
            <SelectableElement kind="date" label="Ort / Location" selected={location.selected} onSelect={location.onSelect} accentColor="#fff">
              <span style={{ fontSize: 13 }}>{location.display || "Ort eingeben"}</span>
            </SelectableElement>
          ) : (
            <span style={{ fontSize: 13 }}>{location.display}</span>
          )}
          <span className="iv-hero-meta-divider" aria-hidden="true" />
          {editable ? (
            <SelectableElement kind="date" label="Datum & Uhrzeit" selected={date.selected} onSelect={date.onSelect} accentColor="#fff">
              <span style={{ fontSize: 13 }}>{date.display || "Datum folgt"}</span>
            </SelectableElement>
          ) : (
            <span style={{ fontSize: 13 }}>{date.display || "Datum folgt"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
