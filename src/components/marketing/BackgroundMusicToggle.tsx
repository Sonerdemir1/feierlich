"use client";

import { useRef, useState } from "react";

// Bewusst kein Autoplay — Browser blockieren Ton-Autoplay ohne
// Nutzer-Interaktion ohnehin, und ungefragte Musik beim Seitenaufruf
// wirkt eher aufdringlich als festlich. Stattdessen ein dezenter,
// dauerhaft erreichbarer Schalter, den Gaeste selbst antippen.
export function BackgroundMusicToggle({ url, accent, background }: { url: string; accent: string; background: string }) {
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
    <>
      <audio ref={audioRef} src={url} loop />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Musik pausieren" : "Musik abspielen"}
        title={playing ? "Musik pausieren" : "Musik abspielen"}
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          zIndex: 30,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          background,
          color: accent,
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          fontSize: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? "🔊" : "🔈"}
      </button>
    </>
  );
}
