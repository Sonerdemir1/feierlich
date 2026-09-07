// Ein einziger Key fuer beides: Places-Autocomplete (Dashboard, beim
// Event-Anlegen) und die Karten-Einbettung (oeffentliche Event-Seite) —
// beides laeuft im Browser, ein NEXT_PUBLIC_-Key ist also ohnehin sichtbar.
// Wird ueber HTTP-Referrer-Einschraenkung in der Google-Cloud-Konsole
// abgesichert, nicht durch Geheimhaltung.
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export const googleMapsConfigured = Boolean(GOOGLE_MAPS_API_KEY);

declare global {
  interface Window {
    google?: typeof google;
    __einladiGoogleMapsLoading?: Promise<void>;
  }
}

// Laedt die Google-Maps-JS-API (places-Bibliothek) genau einmal pro
// Seitenaufruf, auch wenn mehrere Instanzen eines Autocomplete-Feldes
// gleichzeitig gemountet sind (verhindert doppelt eingefuegte <script>-Tags).
// Geteilt zwischen PlaceAutocompleteInput.tsx (formulargebunden, siehe
// NewEventWizard.tsx/dashboard "Details bearbeiten") und
// PlaceAutocompleteField.tsx (kontrolliert, fuer die Klick-Auswahl-Editoren).
export function loadGoogleMapsScript(apiKey: string): Promise<void> {
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

// Baut den Google-Maps-Such-Link aus Name+Adresse — geteilt zwischen der
// echten Event-Seite (e/[slug]/page.tsx) und dem anonymen Marketing-
// Customizer (DesignStudio.tsx), damit der "Google Maps"-Button ueberall
// gleich funktioniert.
export function googleMapsSearchUrl(parts: (string | null | undefined)[]): string {
  const query = encodeURIComponent(parts.filter(Boolean).join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
