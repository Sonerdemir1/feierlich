"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { InlineEditableText } from "@/components/public/InlineEditableText";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
  };
}

// Die drei Beschriftungen ("TAGE"/"STD"/"MIN") teilen sich EINEN Stil-Key
// ("countdownLabel"), haben aber je einen eigenen Textwert — gleiches
// Muster wie familyLeft/familyRight in HeroCard.tsx (renderFamily): eine
// gemeinsame Auswahl/Optik fuer mehrere Textstellen, weil ein Countdown mit
// uneinheitlich gestylten Einheiten (z.B. "TAGE" fett, "MIN" kursiv) kaum
// gewuenscht waere. Die Zahlen selbst bleiben dynamisch berechnet und nicht
// editierbar/stylebar (siehe Schritt 5).
export function Countdown({
  targetIso,
  accent,
  editMode = false,
  eventId,
  daysLabel = "TAGE",
  hoursLabel = "STD",
  minutesLabel = "MIN",
  labelOverride,
  selected = false,
  onSelect,
}: {
  targetIso: string;
  accent: string;
  editMode?: boolean;
  eventId?: string;
  daysLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  labelOverride?: CSSProperties;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const target = new Date(targetIso).getTime();
  const [value, setValue] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setValue(diff(target)), 30000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { n: value.days, field: "countdownDaysLabel" as const, label: daysLabel },
    { n: value.hours, field: "countdownHoursLabel" as const, label: hoursLabel },
    { n: value.minutes, field: "countdownMinutesLabel" as const, label: minutesLabel },
  ];

  const row = (
    <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
      {units.map(({ n, field, label }) => (
        <div key={field} style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: accent }}>{n}</div>
          {editMode ? (
            <InlineEditableText
              eventId={eventId!}
              field={field}
              value={label}
              onFocus={onSelect}
              style={{ fontSize: 9.5, letterSpacing: "0.1em", opacity: 0.65, ...labelOverride }}
            />
          ) : (
            <div style={{ fontSize: 9.5, letterSpacing: "0.1em", opacity: 0.65, ...labelOverride }}>{label}</div>
          )}
        </div>
      ))}
    </div>
  );

  if (!editMode) return row;
  return (
    <SelectableElement kind="text" label="Countdown-Beschriftung" selected={selected} onSelect={onSelect ?? (() => {})} style={{ display: "block" }}>
      {row}
    </SelectableElement>
  );
}
