"use client";

import { useMemo, useState } from "react";
import { FONT_OPTIONS, FONT_CATEGORY_LABELS, type FontCategory } from "@/lib/fonts";

const CATEGORIES = Object.keys(FONT_CATEGORY_LABELS) as FontCategory[];

// Umgebungsunabhaengiger Praesentations-Baustein (siehe Umsetzungsplan) —
// reine Props rein/raus. Kategorisierte Tabs + Suche + echte Font-Previews
// (jede Schrift wird in ihrer eigenen Schriftart dargestellt, nicht in
// Systemschrift) statt des bisherigen 7er-Buttonrasters mit fester Schrift
// fuers ganze Element.
export function FontPicker({ value, onChange }: { value: string | undefined; onChange: (fontId: string | undefined) => void }) {
  const [category, setCategory] = useState<FontCategory>("klassisch");
  const [search, setSearch] = useState("");

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term) return FONT_OPTIONS.filter((f) => f.label.toLowerCase().includes(term));
    return FONT_OPTIONS.filter((f) => f.category === category);
  }, [search, category]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Schriftart suchen…"
        style={{ padding: "8px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 12.5 }}
      />
      {!search && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              style={{
                padding: "5px 10px",
                border: `1px solid ${category === c ? "var(--ink)" : "var(--line)"}`,
                background: category === c ? "var(--ink)" : "var(--ivory)",
                color: category === c ? "var(--ivory)" : "var(--ink-soft)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {FONT_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 220, overflowY: "auto", border: "1px solid var(--line)", padding: 6 }}>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            border: "1px solid var(--line)",
            background: !value ? "var(--ink)" : "transparent",
            color: !value ? "var(--ivory)" : "var(--ink)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Element-Standard
        </button>
        {results.length === 0 && <div style={{ fontSize: 11.5, color: "var(--ink-faint)", padding: "6px 2px" }}>Keine Schriftart gefunden.</div>}
        {results.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              border: "1px solid var(--line)",
              background: value === f.id ? "var(--ink)" : "transparent",
              color: value === f.id ? "var(--ivory)" : "var(--ink)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontFamily: f.cssVar, fontStyle: f.italic ? "italic" : "normal", textTransform: f.uppercase ? "uppercase" : "none", fontSize: 16 }}>
              {f.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
