"use client";

// Umgebungsunabhaengiger Praesentations-Baustein wie SelectableElement/
// TextControls (siehe Umsetzungsplan) — reine Props rein/raus, damit dieselbe
// Komponente spaeter auch die im Dashboard noch offene Abschnitts-
// Reihenfolge (e/[slug]/page.tsx) bedienen kann, ohne Neubau.
export type SectionListItem = {
  key: string;
  label: string;
  checked: boolean;
  tier?: string;
};

export function SectionsList({
  items,
  onToggle,
  onMove,
}: {
  items: SectionListItem[];
  onToggle: (key: string, value: boolean) => void;
  onMove: (key: string, direction: "up" | "down") => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item, i) => (
        <div
          key={item.key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--line)",
            padding: "8px 10px",
            background: "var(--ivory)",
          }}
        >
          <label className="customizer-toggle" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <input type="checkbox" checked={item.checked} onChange={(e) => onToggle(item.key, e.target.checked)} />
            <span className="customizer-switch" aria-hidden="true" />
            <span className="customizer-toggle-text" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {item.label}
              {item.tier && <span className="customizer-tier-badge">ab {item.tier}</span>}
            </span>
          </label>
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => onMove(item.key, "up")}
              disabled={i === 0}
              aria-label={`${item.label} nach oben`}
              style={{
                width: 24,
                height: 24,
                border: "1px solid var(--line)",
                background: "#ffffff",
                cursor: i === 0 ? "default" : "pointer",
                opacity: i === 0 ? 0.35 : 1,
                fontSize: 11,
              }}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onMove(item.key, "down")}
              disabled={i === items.length - 1}
              aria-label={`${item.label} nach unten`}
              style={{
                width: 24,
                height: 24,
                border: "1px solid var(--line)",
                background: "#ffffff",
                cursor: i === items.length - 1 ? "default" : "pointer",
                opacity: i === items.length - 1 ? 0.35 : 1,
                fontSize: 11,
              }}
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
