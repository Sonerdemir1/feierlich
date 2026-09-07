"use client";

import type { CSSProperties } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { WISHLIST_TYPES, WISHLIST_TYPE_LABEL, type WishlistItemData } from "@/lib/wishlist";

// Umgebungsunabhaengiger Praesentations-Baustein wie AgendaList.tsx —
// gruppiert nach Typ (wie die echte Gaeste-Ansicht in e/[slug]/page.tsx),
// damit die Editor-Vorschau nicht von der spaeteren echten Anzeige abweicht.
// "Hoch/runter" bewegt einen Artikel innerhalb seiner eigenen Gruppe (siehe
// moveWishlistItem in lib/wishlist.ts) — kein Stil pro Artikel (anders als
// Ablaufplan-Eintraege), ein Wunschartikel ist reiner Inhalt.
export function WishlistList({
  items,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  baseStyle,
  accentColor,
}: {
  items: WishlistItemData[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  const groups = WISHLIST_TYPES.map((type) => ({ type, items: items.filter((it) => it.type === type) })).filter((g) => g.items.length > 0);
  return (
    <div className="customizer-card-wishlist">
      {groups.map((group) => (
        <div key={group.type} className="customizer-card-wishlist-group">
          <div className="customizer-card-wishlist-group-label" style={{ color: accentColor }}>
            {WISHLIST_TYPE_LABEL[group.type]}
          </div>
          {group.items.map((item, i) => (
            <div key={item.id} className="customizer-card-wishlist-item-wrap">
              <SelectableElement kind="date" label="Wunschlisten-Artikel" selected={selectedId === item.id} onSelect={() => onSelect(item.id)}>
                <div className="customizer-card-wishlist-row" style={{ ...baseStyle, borderColor: `${accentColor}88` }}>
                  <div style={{ fontWeight: 600 }}>{item.title || "Neuer Wunsch"}</div>
                  {item.description && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{item.description}</div>}
                  {item.url && (
                    <div style={{ fontSize: 11, color: accentColor, marginTop: 4 }}>Öffnen →</div>
                  )}
                </div>
              </SelectableElement>
              {selectedId === item.id && (
                <div className="customizer-card-wishlist-icons">
                  <button type="button" onClick={() => onMove(item.id, "up")} disabled={i === 0} title="Nach oben" aria-label="Artikel nach oben verschieben">
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(item.id, "down")}
                    disabled={i === group.items.length - 1}
                    title="Nach unten"
                    aria-label="Artikel nach unten verschieben"
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => onRemove(item.id)} title="Entfernen" aria-label="Artikel entfernen">
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <button type="button" className="customizer-card-wishlist-add" onClick={onAdd}>
        + Artikel hinzufügen
      </button>
    </div>
  );
}
