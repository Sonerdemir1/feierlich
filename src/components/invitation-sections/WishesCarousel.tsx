"use client";

import { useState } from "react";
import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

export type WishEntry = { id: string; name: string; message: string; photoUrl?: string };

// Gästebuch als zentrierte Einzelkarte mit Karussell-Charakter (Belle
// "Friends wishes"). heading/hint/buttonText sind bestehende, editierbare
// Felder (guestbookHeading/-Hint/-ButtonText); die Eintragsliste kommt aus
// echten Gästebuch-Eintraegen (Phase D) bzw. einem Beispiel-Eintrag in der
// Gestalten-Vorschau.
export function WishesCarousel({
  colors,
  fontFamily,
  fontStyle = "normal",
  heading,
  hint,
  buttonText,
  entries,
  editable = true,
}: {
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  heading: TextField;
  hint: TextField;
  buttonText: TextField;
  entries: WishEntry[];
  editable?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const current = entries[index];

  return (
    <section className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
      <div className="iv-inner">
        <div className="iv-head">
          <span className="iv-eyebrow">Beste Wünsche</span>
          <EditableText
            field={heading}
            editable={editable}
            as="h2"
            label="Gästebuch-Überschrift"
            placeholder="Gästebuch"
            className="iv-heading"
            style={{ fontFamily, fontStyle, color: colors.primary }}
          />
          <EditableText field={hint} editable={editable} as="p" label="Gästebuch-Hinweistext" placeholder="" className="iv-intro" />
        </div>

        {current && (
          <div className="iv-wishes-card">
            <div className="iv-wishes-avatar" style={current.photoUrl ? { backgroundImage: `url(${current.photoUrl})` } : { background: colors.accent }} />
            <div className="iv-wishes-name">{current.name}</div>
            <div className="iv-wishes-quote">„{current.message}“</div>
            {entries.length > 1 && (
              <div className="iv-wishes-nav">
                <button type="button" onClick={() => setIndex((i) => (i - 1 + entries.length) % entries.length)} aria-label="Vorheriger Wunsch">
                  ←
                </button>
                <button type="button" onClick={() => setIndex((i) => (i + 1) % entries.length)} aria-label="Nächster Wunsch">
                  →
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ maxWidth: 420, margin: "36px auto 0", textAlign: "center" }}>
          <div style={{ padding: "11px 13px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5, color: colors.primary, marginBottom: 10, textAlign: "left" }}>
            Eure Nachricht …
          </div>
          <EditableText
            field={buttonText}
            editable={editable}
            as="span"
            label="Gästebuch-Button"
            placeholder="Nachricht hinterlassen"
            style={{ display: "inline-block", padding: "11px 23px", fontSize: 13.5, fontWeight: 600, background: colors.accent, color: "#fff" }}
          />
        </div>
      </div>
    </section>
  );
}
