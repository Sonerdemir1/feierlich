"use client";

import { WISHLIST_TYPES, WISHLIST_TYPE_LABEL, type WishlistItemType } from "@/lib/wishlist";

const fieldStyle = { padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 };

// Umgebungsunabhaengiger Praesentations-Baustein wie AgendaItemQuickEdit.tsx
// — reine Props rein/raus, fuer GENAU den auf der Karte ausgewaehlten
// Wunschlisten-Artikel. Kein TextControls-Aufruf (anders als beim
// Ablaufplan-Eintrag): ein Wunschartikel ist reiner Inhalt ohne eigenen
// Stil, siehe Schritt-4-Vorgabe.
export function WishlistItemQuickEdit({
  type,
  title,
  description,
  url,
  onChange,
}: {
  type: WishlistItemType;
  title: string;
  description: string;
  url: string;
  onChange: (patch: { type?: WishlistItemType; title?: string; description?: string; url?: string }) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Kategorie
        <select value={type} onChange={(e) => onChange({ type: e.target.value as WishlistItemType })} style={fieldStyle}>
          {WISHLIST_TYPES.map((t) => (
            <option key={t} value={t}>
              {WISHLIST_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Titel
        <input type="text" value={title} placeholder="z. B. Geschirr-Set" onChange={(e) => onChange({ title: e.target.value })} style={fieldStyle} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Beschreibung (optional)
        <input type="text" value={description} placeholder="z. B. Marke/Set-Wunsch" onChange={(e) => onChange({ description: e.target.value })} style={fieldStyle} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Link (optional)
        <input type="text" value={url} placeholder="https://…" onChange={(e) => onChange({ url: e.target.value })} style={fieldStyle} />
      </label>
    </div>
  );
}
