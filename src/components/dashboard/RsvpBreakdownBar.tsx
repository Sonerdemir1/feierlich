const SEGMENTS = [
  { key: "yes", label: "Zusage", color: "var(--sage)" },
  { key: "pending", label: "Unsicher", color: "var(--gold)" },
  { key: "no", label: "Absage", color: "#C97E5E" },
] as const;

// Statischer, bereits vollstaendig beschrifteter Segment-Balken (keine
// Interaktivitaet noetig) — die Zahl+Farbpunkt-Zeile darunter erfuellt den
// Legenden-Zweck, ohne eine separate Legendenbox zu brauchen.
export function RsvpBreakdownBar({ yes, pending, no }: { yes: number; pending: number; no: number }) {
  const counts = { yes, pending, no };
  const total = yes + pending + no;

  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 10, borderRadius: 5, overflow: "hidden" }}>
        {total === 0 ? (
          <div style={{ flex: 1, background: "var(--line)" }} />
        ) : (
          SEGMENTS.map((s) => {
            const value = counts[s.key];
            if (value === 0) return null;
            return <div key={s.key} style={{ flex: value, background: s.color }} title={`${s.label}: ${value}`} />;
          })
        )}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
        {SEGMENTS.map((s) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            {s.label} <strong style={{ color: "var(--ink)" }}>{counts[s.key]}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
