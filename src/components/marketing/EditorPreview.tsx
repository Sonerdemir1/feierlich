"use client";

import { useState } from "react";

const ACCENT_COLORS = ["#B2543A", "#B9975B", "#211C19", "#8F9B6E"];

export function EditorPreview() {
  const [accent, setAccent] = useState(ACCENT_COLORS[0]);

  return (
    <div style={{ width: "100%", fontFamily: "var(--font-body)", color: "#2A2420" }}>
      <header style={{ padding: "22px 22px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 18,
            color: "#211C19",
          }}
        >
          Design anpassen
        </div>
      </header>

      <div style={{ padding: "4px 22px 18px" }}>
        <div
          style={{
            border: `1px solid ${accent}`,
            background: "#F3ECDF",
            padding: "28px 20px",
            textAlign: "center",
            transition: "border-color .15s",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 22,
              color: accent,
              transition: "color .15s",
            }}
          >
            Anna &amp; Lukas
          </div>
          <div
            style={{
              width: 22,
              height: 1,
              background: accent,
              margin: "12px auto",
              transition: "background .15s",
            }}
          />
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "#5C5248" }}>
            14. JUNI 2026 · SCHLOSS EHRENFELS
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderTop: "1px solid #E4D9C8", borderBottom: "1px solid #E4D9C8" }}>
        <div style={{ flex: 1, textAlign: "center", padding: "11px 0", fontSize: 11.5, color: "#5C5248" }}>Text</div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            padding: "11px 0",
            fontSize: 11.5,
            fontWeight: 600,
            color: "#211C19",
            borderBottom: "2px solid #211C19",
            marginBottom: -1,
          }}
        >
          Farbe
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "11px 0", fontSize: 11.5, color: "#5C5248" }}>
          Schrift
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "11px 0", fontSize: 11.5, color: "#5C5248" }}>Foto</div>
      </div>

      <div style={{ padding: "20px 22px 8px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#211C19", marginBottom: 12 }}>Akzentfarbe</div>
        <div style={{ display: "flex", gap: 14 }}>
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Akzentfarbe ${c}`}
              onClick={() => setAccent(c)}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: c,
                cursor: "pointer",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: c === accent ? `0 0 0 2px #FAF6EF, 0 0 0 4px ${c}` : "none",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: "26px 22px 34px" }}>
        <button
          type="button"
          style={{
            width: "100%",
            background: "#211C19",
            color: "#FAF6EF",
            border: "none",
            padding: 14,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
