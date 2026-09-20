"use client";

// Inline Ein-/Ausblenden + Umsortieren direkt am Abschnitt (davetli.com-
// Stil: "Gizle"/Hide-Button + Pfeile, hier als deutsches "Ausblenden") —
// kleine, immer sichtbare Werkzeugleiste oben am
// Abschnitt, Alternative zur bisherigen Liste im Seitenpanel
// (SectionsList.tsx, bleibt unveraendert bestehen: dort lassen sich
// ausgeblendete Abschnitte wieder einblenden, das kann diese Inline-
// Steuerung bewusst NICHT — ein ausgeblendeter Abschnitt verschwindet aus
// dem Baum und haette hier keine Angriffsflaeche mehr zum Wiedereinblenden).
// Reine Praesentation wie SelectableElement/ElementToolbar — Aufrufer
// entscheidet, was "verschieben"/"ausblenden" fachlich bedeutet.
export function SectionInlineControls({
  label,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onHide,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onHide: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        background: "rgba(255,255,255,0.94)",
        border: "1px solid var(--line, #E4DDD0)",
        borderRadius: 8,
        boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
      }}
    >
      <button
        type="button"
        title={`${label} nach oben verschieben`}
        aria-label={`${label} nach oben verschieben`}
        onClick={onMoveUp}
        disabled={isFirst}
        style={{
          width: 26,
          height: 26,
          border: "none",
          borderRadius: 5,
          background: "transparent",
          color: "var(--ink, #211C19)",
          fontSize: 12,
          cursor: isFirst ? "default" : "pointer",
          opacity: isFirst ? 0.3 : 1,
        }}
      >
        ↑
      </button>
      <button
        type="button"
        title={`${label} nach unten verschieben`}
        aria-label={`${label} nach unten verschieben`}
        onClick={onMoveDown}
        disabled={isLast}
        style={{
          width: 26,
          height: 26,
          border: "none",
          borderRadius: 5,
          background: "transparent",
          color: "var(--ink, #211C19)",
          fontSize: 12,
          cursor: isLast ? "default" : "pointer",
          opacity: isLast ? 0.3 : 1,
        }}
      >
        ↓
      </button>
      <div style={{ width: 1, height: 18, background: "var(--line, #E4DDD0)", margin: "0 2px" }} />
      <button
        type="button"
        title={`${label} ausblenden`}
        aria-label={`${label} ausblenden`}
        onClick={onHide}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          height: 26,
          padding: "0 8px",
          border: "none",
          borderRadius: 5,
          background: "transparent",
          color: "var(--ink-soft, #5C5248)",
          fontSize: 11.5,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span aria-hidden="true">⊘</span> Ausblenden
      </button>
    </div>
  );
}
