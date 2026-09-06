"use client";

const fieldStyle = { padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 };

// Umgebungsunabhaengiger Praesentations-Baustein wie DateQuickEdit.tsx/
// LocationQuickEdit.tsx — reine Props rein/raus. Zwei Felder (Uhrzeit +
// Bezeichnung) fuer GENAU den auf der Karte ausgewaehlten Ablaufplan-
// Eintrag; Groesse/Ausrichtung/Farbe/Stil/Schriftart laufen separat ueber
// TextControls (siehe DesignStudio.tsx/DesignEditor.tsx), da beide
// Bausteine unabhaengig wiederverwendbar bleiben sollen.
export function AgendaItemQuickEdit({
  time,
  label,
  onChange,
}: {
  time: string;
  label: string;
  onChange: (patch: { time?: string; label?: string }) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Uhrzeit
        <input type="text" value={time} placeholder="z. B. 18:00" onChange={(e) => onChange({ time: e.target.value })} style={fieldStyle} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Bezeichnung
        <input type="text" value={label} placeholder="z. B. Sektempfang" onChange={(e) => onChange({ label: e.target.value })} style={fieldStyle} />
      </label>
    </div>
  );
}
