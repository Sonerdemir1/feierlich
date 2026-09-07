import type { CSSProperties } from "react";
import { ELEMENT_SIZE_PRESETS, type TextAlign, type TextElementKey, type TextElementStyle } from "@/lib/text-style";
import { FontPicker } from "@/components/editor/FontPicker";

// Reihenfolge klein -> gross fuer den +/- Stepper — die Presets selbst
// (src/lib/text-style.ts) sind absichtlich in Anzeige-Reihenfolge sortiert
// (Standard zuerst), fuer einen Groessen-Stepper braucht es aber eine nach
// Groesse aufsteigende Reihenfolge.
const STEP_ORDER = ["sm", "md", "lg", "xl"] as const;

const ALIGN_OPTIONS: { id: TextAlign; label: string; glyph: string }[] = [
  { id: "left", label: "Linksbündig", glyph: "⟸" },
  { id: "center", label: "Zentriert", glyph: "≡" },
  { id: "right", label: "Rechtsbündig", glyph: "⟹" },
  { id: "justify", label: "Blocksatz", glyph: "☰" },
];

const toggleButtonStyle = (active: boolean): CSSProperties => ({
  flex: "1 1 0",
  padding: "8px 0",
  border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
  background: active ? "var(--ink)" : "var(--ivory)",
  color: active ? "var(--ivory)" : "var(--ink)",
  cursor: "pointer",
  fontSize: 13,
});

// Umgebungsunabhaengiger Praesentations-Baustein (siehe Umsetzungsplan) —
// reine Props rein/raus, keine eigene Persistenz/postMessage-Logik. Zeigt
// die volle Steuerung (Groesse/Ausrichtung/Farbe/Stil) fuer GENAU das vom
// Kontext-Panel uebergebene Element.
export function TextControls({
  elementKey,
  label,
  style,
  defaultColor,
  onChange,
  onDeselect,
}: {
  elementKey: TextElementKey;
  label: string;
  style: TextElementStyle;
  defaultColor: string;
  onChange: (patch: Partial<TextElementStyle>) => void;
  onDeselect: () => void;
}) {
  const presets = ELEMENT_SIZE_PRESETS[elementKey];
  const currentSizeId = style.size ?? "md";
  const stepIndex = Math.max(0, STEP_ORDER.indexOf(currentSizeId as (typeof STEP_ORDER)[number]));
  const currentPreset = presets.find((p) => p.id === currentSizeId) ?? presets.find((p) => p.id === "md")!;

  function stepSize(delta: number) {
    const nextIndex = Math.min(STEP_ORDER.length - 1, Math.max(0, stepIndex + delta));
    const nextId = STEP_ORDER[nextIndex];
    onChange({ size: nextId === "md" ? undefined : nextId });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        <button type="button" onClick={onDeselect} style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          Abwählen
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Textgröße</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => stepSize(-1)}
            disabled={stepIndex === 0}
            aria-label="Kleiner"
            style={{ width: 30, height: 30, border: "1px solid var(--line)", background: "var(--ivory)", cursor: stepIndex === 0 ? "default" : "pointer", opacity: stepIndex === 0 ? 0.4 : 1 }}
          >
            −
          </button>
          <span style={{ flex: "1 1 auto", textAlign: "center", fontSize: 12, color: "var(--ink-soft)" }}>{currentPreset.label}</span>
          <button
            type="button"
            onClick={() => stepSize(1)}
            disabled={stepIndex === STEP_ORDER.length - 1}
            aria-label="Größer"
            style={{
              width: 30,
              height: 30,
              border: "1px solid var(--line)",
              background: "var(--ivory)",
              cursor: stepIndex === STEP_ORDER.length - 1 ? "default" : "pointer",
              opacity: stepIndex === STEP_ORDER.length - 1 ? 0.4 : 1,
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Ausrichtung</span>
        <div style={{ display: "flex", gap: 4 }}>
          {ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              title={opt.label}
              aria-label={opt.label}
              onClick={() => onChange({ align: opt.id === "center" ? undefined : opt.id })}
              style={toggleButtonStyle((style.align ?? "center") === opt.id)}
            >
              {opt.glyph}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Stil</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" title="Fett" aria-label="Fett" onClick={() => onChange({ bold: !style.bold })} style={{ ...toggleButtonStyle(Boolean(style.bold)), fontWeight: 700 }}>
            F
          </button>
          <button
            type="button"
            title="Unterstrichen"
            aria-label="Unterstrichen"
            onClick={() => onChange({ underline: !style.underline })}
            style={{ ...toggleButtonStyle(Boolean(style.underline)), textDecoration: "underline" }}
          >
            U
          </button>
          <button
            type="button"
            title="Durchgestrichen"
            aria-label="Durchgestrichen"
            onClick={() => onChange({ strikethrough: !style.strikethrough })}
            style={{ ...toggleButtonStyle(Boolean(style.strikethrough)), textDecoration: "line-through" }}
          >
            S
          </button>
          <button
            type="button"
            title="Kursiv"
            aria-label="Kursiv"
            onClick={() => onChange({ italic: !style.italic })}
            style={{ ...toggleButtonStyle(Boolean(style.italic)), fontStyle: "italic" }}
          >
            K
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <label title="Eigene Farbe verwenden (sonst folgt der Text der globalen Primär-Farbe)" style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11.5, color: "var(--ink-soft)" }}>
          <input type="checkbox" checked={Boolean(style.color)} onChange={(e) => onChange({ color: e.target.checked ? (style.color ?? defaultColor) : undefined })} />
          Eigene Farbe
        </label>
        <input
          type="color"
          value={style.color ?? defaultColor}
          onChange={(e) => onChange({ color: e.target.value })}
          style={{ width: 34, height: 30, border: "1px solid var(--line)", cursor: "pointer", padding: 0, marginLeft: "auto" }}
        />
      </div>

      <details>
        <summary style={{ cursor: "pointer", fontSize: 11.5, color: "var(--terracotta-dark)", fontWeight: 600 }}>Erweiterte Optionen — eigene Schriftart</summary>
        <div style={{ marginTop: 10 }}>
          <FontPicker value={style.fontId} onChange={(fontId) => onChange({ fontId })} />
        </div>
      </details>
    </div>
  );
}
