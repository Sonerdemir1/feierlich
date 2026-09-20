"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
  };
}

// "Der grosse Tag" + Countdown in einem gemeinsamen Foto-/Farb-Band
// (Belle-Vorbild: beides teilt sich dieselbe Flaeche, siehe Plan). Die
// Beschriftungen (Tage/Std/Min) sind editierbar (bestehendes
// countdownLabel-Feld), Datum/Intro-Text ebenso — die Zahlen selbst sind
// reine Berechnung, nicht editierbar (gleiches Prinzip wie bisheriger
// Countdown.tsx).
export function BigDayCountdown({
  photoUrl,
  colors,
  fontFamily,
  fontStyle = "normal",
  dateDisplay,
  targetIso,
  intro,
  daysLabel,
  hoursLabel,
  minutesLabel,
  editable = true,
}: {
  photoUrl?: string;
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  dateDisplay: string;
  targetIso: string | undefined;
  intro: TextField;
  daysLabel: TextField;
  hoursLabel: TextField;
  minutesLabel: TextField;
  editable?: boolean;
}) {
  const target = targetIso ? new Date(targetIso).getTime() : undefined;
  const [value, setValue] = useState(() => (target ? diff(target) : { days: 0, hours: 0, minutes: 0 }));

  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setValue(diff(target)), 30000);
    return () => clearInterval(id);
  }, [target]);

  const bandStyle: CSSProperties = {
    ["--iv-band-from" as string]: colors.primary,
    ["--iv-band-to" as string]: colors.accent,
    ...(photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
  };

  const units = [
    { n: value.days, field: daysLabel, fallback: "Tage" },
    { n: value.hours, field: hoursLabel, fallback: "Std" },
    { n: value.minutes, field: minutesLabel, fallback: "Min" },
  ];

  return (
    <div className="iv-band" style={bandStyle}>
      <div className="iv-band-content iv-inner iv-bigday">
        <div className="iv-bigday-heading" style={{ fontFamily, fontStyle }}>
          Der große Tag
        </div>
        <div className="iv-bigday-date" style={{ fontFamily, fontStyle }}>
          {dateDisplay || "Datum folgt"}
        </div>
        <EditableText
          field={intro}
          editable={editable}
          as="p"
          label="Beschreibung"
          placeholder="Wir freuen uns, diesen Tag mit euch zu feiern."
          className="iv-bigday-intro"
          accentColor="#fff"
        />
      </div>
      {target && (
        <div className="iv-band-content iv-countdown">
          {units.map(({ n, field, fallback }) => (
            <div key={fallback} className="iv-countdown-unit">
              <span className="iv-countdown-num">{n}</span>
              <EditableText
                field={field}
                editable={editable}
                as="span"
                label="Countdown-Beschriftung"
                placeholder={fallback}
                style={{ display: "block", marginTop: 6, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75 }}
                accentColor="#fff"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
