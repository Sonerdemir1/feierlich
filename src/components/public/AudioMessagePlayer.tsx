"use client";

import { useRef, useState } from "react";

// Einmalige Sprachnachricht (Schritt 7) — bewusst KEIN Loop/Autoplay, anders
// als BackgroundMusicToggle.tsx (dort dauerhafter, fixierter Schalter fuer
// eine Endlosschleife). Hier: ein Play/Pause-Button inline in der Sektion,
// passend zum Mockup in DesignStudio.tsx (Play-Symbol + dekorative
// Balken-Anzeige).
export function AudioMessagePlayer({ url, accent, primary }: { url: string; accent: string; primary: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying((p) => !p);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        border: `1px solid ${accent}55`,
        maxWidth: 340,
        margin: "0 auto",
      }}
    >
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Sprachnachricht pausieren" : "Sprachnachricht abspielen"}
        style={{
          width: 40,
          height: 40,
          minWidth: 40,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background: accent,
          color: primary,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: playing ? 0 : 2,
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20, flex: 1 }}>
        {[6, 11, 15, 9, 16, 7, 12].map((h, i) => (
          <span key={i} style={{ display: "block", width: 3, height: h, background: `${accent}99` }} />
        ))}
      </div>
    </div>
  );
}
