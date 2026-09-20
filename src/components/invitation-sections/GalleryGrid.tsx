"use client";

import { useState } from "react";
import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

// Galerie mit Filter-Tabs + gleichmaessigem Raster (Belle-Vorbild). Ohne
// echte Fotos (Gestalten-Vorschau vor Signup) faerbt sich das Raster aus
// der Akzentfarbe ein — sobald echte Gästefotos existieren (echte
// Event-Seite, Phase D), ersetzt `photos` die Platzhalter 1:1.
export function GalleryGrid({
  colors,
  fontFamily,
  fontStyle = "normal",
  heading,
  hint,
  buttonText,
  photos,
  filters,
  editable = true,
  onUploadClick,
}: {
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  heading: TextField;
  hint: TextField;
  buttonText: TextField;
  photos?: string[];
  filters?: string[];
  editable?: boolean;
  // Nutzer-Bugfix: der Button darunter liess sich bisher nur beschriften
  // (EditableText), nicht tatsaechlich anklicken, um ein Foto hochzuladen
  // — "man kann nur die Schrift umaendern, totaler Schwachsinn". Jetzt
  // sowohl die leeren Platzhalter-Kacheln als auch der Button selbst
  // klickbar (getrennt vom Text-Editier-Klick auf das Label).
  onUploadClick?: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState(0);
  const filterLabels = filters && filters.length > 0 ? filters : ["Alle"];
  const placeholderOpacities = [0.9, 0.6, 0.8, 0.5, 1, 0.7, 0.55, 0.85];
  const tiles = photos && photos.length > 0 ? photos : new Array(8).fill(null);

  return (
    <section className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
      <div className="iv-inner">
        <div className="iv-head">
          <span className="iv-eyebrow">Unsere Erinnerungen</span>
          <EditableText
            field={heading}
            editable={editable}
            as="h2"
            label="Galerie-Überschrift"
            placeholder="Teilt eure schönsten Momente"
            className="iv-heading"
            style={{ fontFamily, fontStyle, color: colors.primary }}
          />
          <EditableText field={hint} editable={editable} as="p" label="Galerie-Hinweistext" placeholder="" className="iv-intro" />
        </div>

        {filterLabels.length > 1 && (
          <div className="iv-gallery-filters">
            {filterLabels.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`iv-gallery-filter${i === activeFilter ? " is-active" : ""}`}
                onClick={() => setActiveFilter(i)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="iv-gallery-grid">
          {tiles.map((photo, i) => (
            <div
              key={i}
              className="iv-gallery-tile"
              onClick={editable && !photo ? onUploadClick : undefined}
              role={editable && !photo ? "button" : undefined}
              aria-label={editable && !photo ? "Foto hinzufügen" : undefined}
              style={
                photo
                  ? { backgroundImage: `url(${photo})` }
                  : {
                      background: colors.accent,
                      opacity: placeholderOpacities[i % placeholderOpacities.length],
                      cursor: editable ? "pointer" : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }
              }
            >
              {editable && !photo && (
                <span aria-hidden="true" style={{ fontSize: 22, color: "#fff", opacity: 0.85 }}>
                  +
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="iv-gallery-more" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <EditableText
            field={buttonText}
            editable={editable}
            as="span"
            label="Galerie-Upload-Button"
            placeholder="Foto oder Video auswählen"
            style={{ display: "inline-block", padding: "11px 23px", fontSize: 13.5, fontWeight: 600, border: "1px solid var(--line)", background: "var(--ivory-2)" }}
          />
          {editable && onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              title="Foto hochladen"
              aria-label="Foto hochladen"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "1px solid var(--line)",
                background: colors.accent,
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
