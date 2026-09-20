"use client";

import type { CSSProperties } from "react";
import type { IvColors } from "./types";

export type StatItem = { value: string; label: string };

// Statistik-Band — randloses Foto-/Farb-Band mit grossen Zahlen, Belle-
// Vorbild ("60 kisses", "12 sleepless nights", ...). Rein dekorativ,
// deshalb bewusst nicht editierbar (kein echtes Datenfeld dahinter).
export function StatsBand({ photoUrl, colors, fontFamily, fontStyle = "normal", stats }: {
  photoUrl?: string;
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  stats: StatItem[];
}) {
  const bandStyle: CSSProperties = {
    ["--iv-band-from" as string]: colors.accent,
    ["--iv-band-to" as string]: colors.primary,
    ...(photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
  };

  return (
    <div className="iv-band" style={bandStyle}>
      <div className="iv-band-content iv-inner iv-stats-row">
        {stats.map((s) => (
          <div key={s.label}>
            <span className="iv-stats-num">{s.value}</span>
            <span className="iv-stats-label" style={{ fontFamily, fontStyle }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
