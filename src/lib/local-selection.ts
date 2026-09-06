"use client";

import { useEffect } from "react";

// Sorgt dafuer, dass innerhalb DESSELBEN iframe-Dokuments (e/[slug]/page.tsx)
// jeweils nur EIN editierbares Element gleichzeitig den Auswahl-Rahmen zeigt.
// Gefunden waehrend Schritt 5 (RSVP): jede der Editable*.tsx-Komponenten
// ausserhalb von HeroCard.tsx (die eigene, dort schon korrekt zentrale
// selectedKey-Logik hat) hielt "selected" bisher als rein lokalen State,
// der nie zurueckgesetzt wurde, sobald ein ANDERES Element angeklickt
// wurde — mehrere Elemente blieben dadurch gleichzeitig sichtbar
// "ausgewaehlt". Betraf nicht nur die neuen RSVP-Felder, sondern auch
// Location/Beschreibung/Gaestebuch/Wunschliste/Musikwuensche aus
// Schritt 1/3/4. Jede Komponente ruft broadcastSelection(identity) beim
// Anklicken auf und meldet sich per useSelectionBroadcast an, um zu
// erfahren, ob eine ANDERE Identity aktiv wurde (dann selbst abwaehlen).
const EVENT_NAME = "einladi-local-select";

export function broadcastSelection(identity: string) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { identity } }));
}

export function useSelectionBroadcast(onSelect: (identity: string) => void) {
  useEffect(() => {
    function handle(e: Event) {
      onSelect((e as CustomEvent<{ identity: string }>).detail.identity);
    }
    window.addEventListener(EVENT_NAME, handle);
    return () => window.removeEventListener(EVENT_NAME, handle);
  }, [onSelect]);
}
