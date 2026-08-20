"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
  };
}

export function Countdown({ targetIso, accent }: { targetIso: string; accent: string }) {
  const target = new Date(targetIso).getTime();
  const [value, setValue] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setValue(diff(target)), 30000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
      {[
        [value.days, "TAGE"],
        [value.hours, "STD"],
        [value.minutes, "MIN"],
      ].map(([n, label]) => (
        <div key={label as string} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: accent }}>{n}</div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.1em", opacity: 0.65 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}
