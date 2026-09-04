"use client";

import { useRef, useState } from "react";

type Colors = { primary: string; accent: string; background: string };

// Ersetzt den nativen <input type="file"> (der bei manchen Browsern/
// Trackpads mehrere Klicks brauchte, bis sich der Dateidialog öffnet) durch
// einen echten Button mit direktem .click()-Aufruf auf ein verstecktes
// Input — zuverlässiger als sich auf den nativen Rand-Klick zu verlassen,
// und zeigt zusätzlich den gewählten Dateinamen an.
export function FileField({
  name,
  accept,
  required,
  label,
  colors,
  autoSubmit,
}: {
  name: string;
  accept: string;
  required?: boolean;
  label: string;
  colors: Colors;
  // Reicht die Datei direkt beim Auswaehlen ein, ohne separaten Tap auf
  // einen Absenden-Button — siehe Galerie-Upload in e/[slug]/page.tsx
  // (Ziel: so wenige Beruehrungen wie moeglich vom QR-Scan bis zum
  // hochgeladenen Foto). Nicht bei Gaestebuch-Anhaengen genutzt, dort soll
  // ein Anhang die restliche Nachricht nicht vorzeitig abschicken.
  autoSubmit?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
        onChange={(e) => {
          setFileName(e.target.files?.[0]?.name ?? null);
          if (autoSubmit && e.target.files?.[0]) e.target.form?.requestSubmit();
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          padding: "11px 13px",
          border: `1px solid ${colors.accent}55`,
          background: "transparent",
          color: fileName ? colors.primary : `${colors.primary}99`,
          fontSize: 13,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        {fileName ?? label}
      </button>
    </div>
  );
}
