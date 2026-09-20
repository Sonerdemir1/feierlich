"use client";

import { AgendaList } from "@/components/editor/AgendaList";
import type { AgendaItem } from "@/lib/agenda";
import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

// Ablaufplan als Belle-artiger Zweispalter: Foto links, Terminliste
// rechts. Die Liste selbst nutzt die bereits bestehende, umgebungs-
// unabhaengige AgendaList (Auswahl/Hinzufuegen/Entfernen/Verschieben) statt
// das Rad neu zu erfinden — nur die umgebende Flaeche ist neu.
export function EventsTimeline({
  photoUrl,
  colors,
  fontFamily,
  fontStyle = "normal",
  heading,
  intro,
  items,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  editable = true,
}: {
  photoUrl?: string;
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  heading?: TextField;
  intro?: TextField;
  items: AgendaItem[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  editable?: boolean;
}) {
  return (
    <section className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
      <div className="iv-inner">
        <div className="iv-head">
          <span className="iv-eyebrow">Ablaufplan</span>
          {heading ? (
            <EditableText
              field={heading}
              editable={editable}
              as="h2"
              label="Ablaufplan-Überschrift"
              placeholder="Der Ablauf des Tages"
              className="iv-heading"
              style={{ fontFamily, fontStyle, color: colors.primary }}
            />
          ) : (
            <h2 className="iv-heading" style={{ fontFamily, fontStyle, color: colors.primary }}>
              Der Ablauf des Tages
            </h2>
          )}
          {intro && (
            <EditableText field={intro} editable={editable} as="p" label="Ablaufplan-Hinweistext" placeholder="" className="iv-intro" style={{ marginTop: 8 }} />
          )}
        </div>
        <div className="iv-events-grid">
          <div
            className="iv-events-photo"
            style={
              photoUrl
                ? { backgroundImage: `url(${photoUrl})` }
                : { background: `linear-gradient(155deg, ${colors.accent}, ${colors.primary})` }
            }
          />
          <div className="iv-events-list">
            {editable ? (
              <AgendaList
                items={items}
                selectedId={selectedId}
                onSelect={onSelect}
                onAdd={onAdd}
                onRemove={onRemove}
                onMove={onMove}
                baseStyle={{ color: colors.primary }}
                accentColor={colors.accent}
              />
            ) : (
              items.map((item) => (
                <div key={item.id} className="iv-events-row">
                  <span className="iv-events-row-time" style={{ color: colors.accent }}>
                    {item.time || "--:--"}
                  </span>
                  <span>{item.label || "Programmpunkt"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
