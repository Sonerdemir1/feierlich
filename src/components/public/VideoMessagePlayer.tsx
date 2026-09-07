"use client";

import { useState } from "react";

// Eigenstaendige Video-Einladung-Sektion (Schritt 7) — bewusst getrennt von
// VideoEnvelope.tsx (ersetzt dort die ganze Umschlag-Oeffnen-Animation).
// Hier: ein Play-Button (passend zum Mockup in DesignStudio.tsx), der beim
// ersten Antippen einen echten <video>-Player mit Bedienelementen einblendet
// — kein Autoplay, kein Umschlag-Ersatz.
export function VideoMessagePlayer({ url, accent, primary, background }: { url: string; accent: string; primary: string; background: string }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div style={{ maxWidth: 360, margin: "0 auto" }}>
        <video src={url} controls autoPlay playsInline style={{ width: "100%", borderRadius: 10, display: "block" }} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "0 auto",
        padding: "12px 20px",
        border: `1px solid ${accent}88`,
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          minWidth: 32,
          borderRadius: "50%",
          background: accent,
          color: background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          paddingLeft: 2,
        }}
      >
        ▶
      </span>
      <span style={{ color: primary, fontSize: 13 }}>Videobotschaft ansehen</span>
    </button>
  );
}
