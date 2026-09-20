"use client";

import type { CSSProperties } from "react";
import type { IvColors } from "./types";

// Footer — randloses Foto-/Farb-Band mit Skript-Signatur (Belle "Just
// married"). Namen kommen als bereits fertiger Anzeigetext rein (kein
// eigenes editierbares Feld noetig — spiegelt einfach den Hero-Titel).
export function Footer({ photoUrl, colors, fontFamily, fontStyle = "normal", names }: {
  photoUrl?: string;
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  names: string;
}) {
  const bandStyle: CSSProperties = {
    ["--iv-band-from" as string]: colors.primary,
    ["--iv-band-to" as string]: colors.accent,
    ...(photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
  };

  return (
    <div className="iv-band" style={bandStyle}>
      <div className="iv-band-content iv-inner iv-footer">
        <div className="iv-footer-script" style={{ fontFamily, fontStyle }}>
          {names || "Auf ein neues Kapitel"}
        </div>
        <div className="iv-footer-copy">einladi.de</div>
      </div>
    </div>
  );
}
