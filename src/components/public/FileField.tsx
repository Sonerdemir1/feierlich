"use client";

import { useRef, useState, type CSSProperties } from "react";

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
  onFileSelected,
  style,
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
  // Fuer Aufrufer OHNE umgebendes <form> (z.B. DesignStudio.tsx' anonyme
  // Upload-Route, die per fetch() statt Formular-Submit hochlaedt) — bekommt
  // die ausgewaehlte Datei direkt statt sich auf autoSubmit/e.target.form zu
  // verlassen. Unabhaengig von autoSubmit nutzbar (auch beides zusammen).
  onFileSelected?: (file: File) => void;
  // Optionaler Text-Style-Override (galleryButtonText, Schritt 6) — gleiches
  // Muster wie bei den anderen Buttons in e/[slug]/page.tsx.
  style?: CSSProperties;
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
          const file = e.target.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          if (autoSubmit && file) e.target.form?.requestSubmit();
          if (file) onFileSelected?.(file);
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
          ...style,
        }}
      >
        {fileName ?? label}
      </button>
    </div>
  );
}
