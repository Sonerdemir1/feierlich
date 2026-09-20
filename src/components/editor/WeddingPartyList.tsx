"use client";

import type { CSSProperties } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { WEDDING_PARTY_ROLES, WEDDING_PARTY_ROLE_LABEL, type WeddingPartyMemberData } from "@/lib/wedding-party";

// Umgebungsunabhaengiger Praesentations-Baustein wie WishlistList.tsx —
// gruppiert nach Rolle (Trauzeugen/Brautjungfern), "hoch/runter" bewegt
// einen Eintrag innerhalb seiner eigenen Gruppe (siehe moveWeddingPartyMember
// in lib/wedding-party.ts). Anders als bei der Wunschliste hat jeder Eintrag
// ein Foto — Klick auf den Kreis oeffnet den Datei-Dialog direkt (kein
// Umweg ueber die Quick-Edit-Seitenleiste noetig), analog zum Bugfix bei
// GalleryGrid.tsx ("Foto oder Video auswählen liess sich nicht anklicken").
export function WeddingPartyList({
  items,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  onPhotoClick,
  baseStyle,
  accentColor,
}: {
  items: WeddingPartyMemberData[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: (role: "TRAUZEUGE" | "BRAUTJUNGFER") => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  onPhotoClick: (id: string) => void;
  baseStyle: CSSProperties;
  accentColor: string;
}) {
  const groups = WEDDING_PARTY_ROLES.map((role) => ({ role, items: items.filter((it) => it.role === role) })).filter(
    (g) => g.items.length > 0
  );
  return (
    <div className="customizer-card-wishlist">
      {groups.map((group) => (
        <div key={group.role} className="customizer-card-wishlist-group">
          <div className="customizer-card-wishlist-group-label" style={{ color: accentColor }}>
            {WEDDING_PARTY_ROLE_LABEL[group.role]}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {group.items.map((item, i) => (
              <div key={item.id} style={{ textAlign: "center", width: 84 }}>
                <SelectableElement kind="date" label="Trauzeuge/Brautjungfer" selected={selectedId === item.id} onSelect={() => onSelect(item.id)}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPhotoClick(item.id);
                      }}
                      title="Foto hochladen"
                      aria-label="Foto hochladen"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        border: `1px solid ${accentColor}88`,
                        cursor: "pointer",
                        padding: 0,
                        background: item.photoUrl ? `url(${item.photoUrl}) center/cover` : `${accentColor}33`,
                        color: accentColor,
                        fontSize: 20,
                      }}
                    >
                      {!item.photoUrl && "+"}
                    </button>
                    <div style={{ ...baseStyle, fontSize: 12 }}>{item.name || "Name"}</div>
                  </div>
                </SelectableElement>
                {selectedId === item.id && (
                  <div className="customizer-card-wishlist-icons" style={{ justifyContent: "center", marginTop: 4 }}>
                    <button type="button" onClick={() => onMove(item.id, "up")} disabled={i === 0} title="Nach oben" aria-label="Nach oben verschieben">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(item.id, "down")}
                      disabled={i === group.items.length - 1}
                      title="Nach unten"
                      aria-label="Nach unten verschieben"
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => onRemove(item.id)} title="Entfernen" aria-label="Entfernen">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="customizer-card-wishlist-add" onClick={() => onAdd("TRAUZEUGE")}>
          + Trauzeuge hinzufügen
        </button>
        <button type="button" className="customizer-card-wishlist-add" onClick={() => onAdd("BRAUTJUNGFER")}>
          + Brautjungfer hinzufügen
        </button>
      </div>
    </div>
  );
}
