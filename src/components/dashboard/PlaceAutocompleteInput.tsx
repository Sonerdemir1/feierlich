"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
    __einladiGoogleMapsLoading?: Promise<void>;
  }
}

const inputStyle = { padding: "12px 14px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13.5 };

// Laedt die Google-Maps-JS-API (places-Bibliothek) genau einmal pro
// Seitenaufruf, auch wenn mehrere Instanzen dieser Komponente gleichzeitig
// gemountet sind (verhindert doppelt eingefuegte <script>-Tags).
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__einladiGoogleMapsLoading) return window.__einladiGoogleMapsLoading;

  window.__einladiGoogleMapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps konnte nicht geladen werden."));
    document.head.appendChild(script);
  });
  return window.__einladiGoogleMapsLoading;
}

// Adressfeld mit Google-Places-Autovervollstaendigung — bei Auswahl eines
// Vorschlags werden zusaetzlich Breiten-/Laengengrad in verstecken Feldern
// mitgeschickt (fuer eine spaetere Kartenanzeige), der sichtbare Wert
// bleibt eine ganz normale Text-Eingabe (auch ohne JS/Google-Ladefehler
// weiterhin manuell ausfuellbar).
export function PlaceAutocompleteInput({
  apiKey,
  name,
  latName,
  lngName,
  defaultValue,
  placeholder,
}: {
  apiKey: string;
  name: string;
  latName: string;
  lngName: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return;
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address && inputRef.current) inputRef.current.value = place.formatted_address;
          const loc = place.geometry?.location;
          if (loc) {
            setLat(String(loc.lat()));
            setLng(String(loc.lng()));
          }
        });
      })
      .catch(() => {
        // Ohne Google-Maps geladen bleibt es ein normales Textfeld — kein
        // Fehler fuer den Nutzer noetig.
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return (
    <>
      <input ref={inputRef} type="text" name={name} defaultValue={defaultValue} placeholder={placeholder} style={inputStyle} />
      <input type="hidden" name={latName} value={lat} />
      <input type="hidden" name={lngName} value={lng} />
    </>
  );
}
