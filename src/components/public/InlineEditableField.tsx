"use client";

import { useRef, type CSSProperties, type ElementType } from "react";

// Umgebungsunabhaengiger Kern von InlineEditableText.tsx (siehe
// Umsetzungsplan) — reines contentEditable mit onChange(text)-Callback statt
// eigenem fetch()-Aufruf. InlineEditableText.tsx bleibt der duenne
// Fetch-Wrapper ums Dashboard-Speichern; DesignStudio.tsx (Marketing,
// localStorage statt Server) nutzt diesen Kern direkt.
export function InlineEditableField({
  value,
  onChange,
  as = "div",
  placeholder,
  style,
  onFocus,
  multiline = false,
  status = "idle",
}: {
  value: string;
  // Wird nur bei tatsaechlicher Aenderung beim Verlassen des Feldes
  // aufgerufen (wie zuvor in InlineEditableText.tsx) — die sichtbare
  // Live-Aktualisierung waehrend des Tippens macht das contentEditable-DOM
  // selbst, kein Re-Render pro Tastenanschlag noetig. Darf ein Promise
  // zurueckgeben (z.B. fuer einen fetch()-Speicherversuch) — wirft es,
  // macht dieser Baustein die Aenderung im DOM selbst rueckgaengig, statt
  // dass der Aufrufer den DOM-Knoten kennen muss.
  onChange: (text: string) => void | Promise<void>;
  as?: ElementType;
  placeholder?: string;
  style?: CSSProperties;
  onFocus?: () => void;
  // Enter blurred normalerweise das Feld (Titel/Anlass/Familie etc.) —
  // bei mehrzeiligen Feldern (Beschreibung) soll Enter stattdessen einen
  // Zeilenumbruch einfuegen.
  multiline?: boolean;
  status?: "idle" | "saving" | "saved" | "error";
}) {
  const Tag = as;
  // Letzter bestaetigter Wert (nicht einfach der `value`-Prop bei jedem
  // Render, da contentEditable-Kinder bewusst nicht mit dem Prop
  // resynchronisiert werden — sonst spraenge der Cursor beim Tippen).
  const confirmed = useRef(value);

  async function handleBlur(e: React.FocusEvent<HTMLElement>) {
    const el = e.currentTarget;
    const text = (el.innerText ?? "").trim();
    if (text === confirmed.current) return;
    try {
      await onChange(text);
      confirmed.current = text;
    } catch {
      el.innerText = confirmed.current;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      e.currentTarget.innerText = confirmed.current;
      (e.target as HTMLElement).blur();
    }
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onFocus={onFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      data-inline-status={status}
      className="einladi-inline-editable"
      style={{ outline: "none", cursor: "text", ...style }}
    >
      {value}
    </Tag>
  );
}
