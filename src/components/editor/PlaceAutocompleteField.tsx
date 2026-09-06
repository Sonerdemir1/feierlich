"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { loadGoogleMapsScript } from "@/lib/google-maps";

// Kontrollierte Variante von PlaceAutocompleteInput.tsx (dashboard/) — die
// dortige Version ist bewusst unkontrolliert und formulargebunden (name/
// latName/lngName fuer FormData-Submits, siehe NewEventWizard.tsx und die
// "Details bearbeiten"-Sektion). Diese hier feuert stattdessen reine
// Callbacks (onChange bei jedem Tastendruck, onPlaceSelected sobald ein
// Google-Vorschlag ausgewaehlt wird) — passend fuer die Klick-Auswahl-
// Editoren (DesignStudio.tsx, DesignEditor.tsx/LocationQuickEdit.tsx), die
// ihren State selbst kontrolliert halten statt ueber FormData zu speichern.
export function PlaceAutocompleteField({
  apiKey,
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  style,
  id,
}: {
  apiKey: string | undefined;
  value: string;
  onChange: (text: string) => void;
  onPlaceSelected: (place: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref statt direkter Closure-Erfassung, damit der Autocomplete-Listener
  // (nur einmal pro Mount registriert) immer den aktuellen Callback nutzt,
  // ohne bei jeder Elternkomponenten-Aenderung neu angemeldet zu werden.
  // Aktualisierung bewusst in einem eigenen Effect statt direkt im Render-
  // Body (siehe react-hooks/refs) — ein Ref waehrend des Renderns zu
  // schreiben ist unsicher, in einem Effect danach ist es das nicht.
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;
    let cancelled = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const loc = place.geometry?.location;
          if (place.formatted_address && loc) {
            onPlaceSelectedRef.current({ address: place.formatted_address, lat: loc.lat(), lng: loc.lng() });
          }
        });
      })
      .catch(() => {
        // Ohne Google-Maps geladen bleibt es ein normales Textfeld — kein Fehler fuer den Nutzer noetig.
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );
}
