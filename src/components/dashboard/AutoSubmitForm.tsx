"use client";

import { useRef, useEffect } from "react";
import type { ReactNode } from "react";

// Sendet das Formular automatisch bei jeder Aenderung ab (kurz entprellt),
// statt auf einen expliziten "Speichern"-Klick zu warten — die Vorschau
// (LivePreviewFrame daneben, per revalidatePath+geaenderter frameKey) zeigt
// dadurch neue Farben/Schrift/Textgroesse fast sofort, genau wie im
// eigenstaendigen Design-Studio. Ein "input"-Event reicht fuer alle
// Feldtypen hier (Color-Picker, Radios, Checkboxen, Selects) — native
// <input type="color"> feuert "input" nur, wenn der Picker geschlossen
// wird, nicht waehrend des Ziehens.
export function AutoSubmitForm({ action, children }: { action: (formData: FormData) => void; children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function scheduleSubmit() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 250);
  }

  return (
    <form ref={formRef} action={action} onChange={scheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {children}
    </form>
  );
}
