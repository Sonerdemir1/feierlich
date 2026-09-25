"use client";

import { useState, type CSSProperties } from "react";
import { ELEMENT_SIZE_PRESETS, type TextAlign, type TextElementKey, type TextElementStyle } from "@/lib/text-style";
import { FontPicker } from "@/components/editor/FontPicker";

// Kontext-Toolbar direkt am angeklickten Element (davetli.com-Stil) — im
// Unterschied zu TextControls.tsx (vertikale Liste im Seitenpanel) eine
// kompakte, horizontale Leiste, die SelectableElement.tsx absolut ueber dem
// ausgewaehlten Element positioniert. Gleicher Props-Vertrag wie
// TextControls (elementKey/style/defaultColor/onChange), damit beide
// Bedienwege dieselbe Datenquelle (StyleElements) teilen und nie
// auseinanderlaufen — bewusst eine eigene Datei statt TextControls
// umzubauen, um das funktionierende Seitenpanel nicht anzufassen.
const STEP_ORDER = ["sm", "md", "lg", "xl"] as const;

const ALIGN_OPTIONS: { id: TextAlign; label: string; glyph: string }[] = [
  { id: "left", label: "Linksbündig", glyph: "⟸" },
  { id: "center", label: "Zentriert", glyph: "≡" },
  { id: "right", label: "Rechtsbündig", glyph: "⟹" },
  { id: "justify", label: "Blocksatz", glyph: "☰" },
];

// Groesse/Display kommen jetzt aus der CSS-Klasse ".element-toolbar-btn"
// (globals.css) statt aus Inline-Styles — nur so kann eine mobile
// @media-Regel die Tipp-Flaeche vergroessern (28px war auf einem echten
// Handy-Bildschirm zu klein). Inline bleibt nur, was pro Button variiert
// (aktiv/inaktiv-Farbe).
const btnStyle = (active: boolean): CSSProperties => ({
  background: active ? "var(--ink, #211C19)" : "transparent",
  color: active ? "#fff" : "var(--ink, #211C19)",
});

const divider: CSSProperties = { width: 1, alignSelf: "stretch", background: "var(--line, #E4DDD0)", margin: "0 2px", flexShrink: 0 };

export function ElementToolbar({
  elementKey,
  style,
  defaultColor,
  onChange,
}: {
  elementKey: TextElementKey;
  style: TextElementStyle;
  defaultColor: string;
  onChange: (patch: Partial<TextElementStyle>) => void;
}) {
  const [openPanel, setOpenPanel] = useState<"color" | "font" | null>(null);
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
    <div
      // Klicks in der Toolbar duerfen NICHT als "woanders hingeklickt"
      // durchbubbeln (sonst wuerde jeder Toolbar-Klick sofort das Element
      // wieder abwaehlen, bevor onChange greifen kann).
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="element-toolbar"
      style={{
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        background: "#fff",
        border: "1px solid var(--line, #E4DDD0)",
        borderRadius: 8,
        boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
        zIndex: 40,
      }}
    >
      <button type="button" className="element-toolbar-btn" title="Kleiner" aria-label="Kleiner" disabled={stepIndex === 0} onClick={() => stepSize(-1)} style={{ ...btnStyle(false), opacity: stepIndex === 0 ? 0.35 : 1 }}>
        −
      </button>
      <span style={{ fontSize: 10.5, color: "var(--ink-faint, #8A8072)", minWidth: 44, textAlign: "center" }}>{currentPreset.label}</span>
      <button
        type="button"
        className="element-toolbar-btn"
        title="Größer"
        aria-label="Größer"
        disabled={stepIndex === STEP_ORDER.length - 1}
        onClick={() => stepSize(1)}
        style={{ ...btnStyle(false), opacity: stepIndex === STEP_ORDER.length - 1 ? 0.35 : 1 }}
      >
        +
      </button>

      <div style={divider} />

      {ALIGN_OPTIONS.map((opt) => (
        <button key={opt.id} type="button" className="element-toolbar-btn" title={opt.label} aria-label={opt.label} onClick={() => onChange({ align: opt.id === "center" ? undefined : opt.id })} style={btnStyle((style.align ?? "center") === opt.id)}>
          {opt.glyph}
        </button>
      ))}

      <div style={divider} />

      <button type="button" className="element-toolbar-btn" title="Fett" aria-label="Fett" onClick={() => onChange({ bold: !style.bold })} style={{ ...btnStyle(Boolean(style.bold)), fontWeight: 700 }}>
        F
      </button>
      <button type="button" className="element-toolbar-btn" title="Unterstrichen" aria-label="Unterstrichen" onClick={() => onChange({ underline: !style.underline })} style={{ ...btnStyle(Boolean(style.underline)), textDecoration: "underline" }}>
        U
      </button>
      <button type="button" className="element-toolbar-btn" title="Kursiv" aria-label="Kursiv" onClick={() => onChange({ italic: !style.italic })} style={{ ...btnStyle(Boolean(style.italic)), fontStyle: "italic" }}>
        K
      </button>

      <div style={divider} />

      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="element-toolbar-swatch"
          title="Farbe"
          aria-label="Farbe"
          onClick={() => setOpenPanel(openPanel === "color" ? null : "color")}
          style={{
            borderRadius: "50%",
            border: `2px solid ${openPanel === "color" ? "var(--ink, #211C19)" : "var(--line, #E4DDD0)"}`,
            background: style.color ?? defaultColor,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
        {openPanel === "color" && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "#fff", border: "1px solid var(--line, #E4DDD0)", borderRadius: 8, padding: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.16)", zIndex: 41 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--ink-soft, #5C5248)", cursor: "pointer", marginBottom: 8, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={Boolean(style.color)} onChange={(e) => onChange({ color: e.target.checked ? (style.color ?? defaultColor) : undefined })} />
              Eigene Farbe
            </label>
            <input type="color" value={style.color ?? defaultColor} onChange={(e) => onChange({ color: e.target.value })} style={{ width: "100%", height: 30, border: "1px solid var(--line, #E4DDD0)", cursor: "pointer", padding: 0 }} />
          </div>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <button type="button" className="element-toolbar-btn" title="Schriftart" aria-label="Schriftart" onClick={() => setOpenPanel(openPanel === "font" ? null : "font")} style={btnStyle(openPanel === "font")}>
          Aa
        </button>
        {openPanel === "font" && (
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 220, background: "#fff", border: "1px solid var(--line, #E4DDD0)", borderRadius: 8, padding: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.16)", zIndex: 41 }}>
            <FontPicker value={style.fontId} onChange={(fontId) => onChange({ fontId })} />
          </div>
        )}
      </div>
    </div>
  );
}
