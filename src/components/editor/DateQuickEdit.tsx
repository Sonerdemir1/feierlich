"use client";

// Umgebungsunabhaengiger Praesentations-Baustein wie SelectableElement/
// TextControls (siehe Umsetzungsplan) — reine Props rein/raus. Datum darf
// kein Freitext sein (Countdown/Kalender-Links haengen daran), deshalb ein
// eigener kleiner Formular-Pfad statt InlineEditableText/contentEditable.
export function DateQuickEdit({
  eventDate,
  eventTime,
  onChange,
}: {
  eventDate: string; // "YYYY-MM-DD", passend fuer <input type="date">
  eventTime: string; // "HH:MM" oder "", passend fuer <input type="time">
  onChange: (next: { eventDate: string; eventTime: string }) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Datum
        <input
          type="date"
          value={eventDate}
          onChange={(e) => onChange({ eventDate: e.target.value, eventTime })}
          style={{ padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Uhrzeit (optional)
        <input
          type="time"
          value={eventTime}
          onChange={(e) => onChange({ eventDate, eventTime: e.target.value })}
          style={{ padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 }}
        />
      </label>
    </div>
  );
}
