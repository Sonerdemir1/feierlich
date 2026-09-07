"use client";

import type { CSSProperties } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { elementOverrideStyle } from "@/lib/text-style";
import type { AgendaItem } from "@/lib/agenda";

// Umgebungsunabhaengiger Praesentations-Baustein wie SelectableElement/
// TextControls (siehe Umsetzungsplan) — reine Props rein/raus, damit
// dieselbe Liste 1:1 vom anonymen Marketing-Customizer (DesignStudio.tsx,
// lokaler State) UND von der echten Event-Seite (EditableAgenda.tsx,
// postMessage-getriebener State) genutzt werden kann.
export function AgendaList({
  items,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  baseStyle,
  accentColor,
}: {
  items: AgendaItem[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  return (
    <div className="customizer-card-agenda">
      {items.map((item, i) => {
        const override = elementOverrideStyle({ agenda: item.style }, "agenda");
        return (
          <div key={item.id} className="customizer-card-agenda-item-wrap">
            <SelectableElement kind="date" label="Ablaufplan-Eintrag" selected={selectedId === item.id} onSelect={() => onSelect(item.id)}>
              <div className="customizer-card-agenda-row" style={{ ...baseStyle, ...override }}>
                <span className="customizer-card-agenda-dot" style={{ background: accentColor }} />
                <span className="customizer-card-agenda-time" style={{ color: accentColor }}>
                  {item.time || "--:--"}
                </span>
                <span>{item.label || "Programmpunkt"}</span>
              </div>
            </SelectableElement>
            {selectedId === item.id && (
              <div className="customizer-card-agenda-icons">
                <button type="button" onClick={() => onMove(item.id, "up")} disabled={i === 0} title="Nach oben" aria-label="Eintrag nach oben verschieben">
                  ↑
                </button>
                <button type="button" onClick={() => onMove(item.id, "down")} disabled={i === items.length - 1} title="Nach unten" aria-label="Eintrag nach unten verschieben">
                  ↓
                </button>
                <button type="button" onClick={() => onRemove(item.id)} title="Entfernen" aria-label="Eintrag entfernen">
                  ✕
                </button>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="customizer-card-agenda-add" onClick={onAdd}>
        + Eintrag hinzufügen
      </button>
    </div>
  );
}
