"use client";

import { PlaceAutocompleteField } from "@/components/editor/PlaceAutocompleteField";

const fieldStyle = { padding: "9px 10px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 13 };

// Umgebungsunabhaengiger Praesentations-Baustein wie DateQuickEdit.tsx
// (siehe Umsetzungsplan) — reine Props rein/raus. Zwei Felder, weil das
// echte Event.locationName (Saal-Name, z.B. "Schloss Ehrenfels") und
// Event.locationAddress (die tatsaechliche, per Places-Autocomplete
// gesuchte Adresse fuer Karte/Maps-Link) zwei unabhaengige Werte sind —
// siehe "Details bearbeiten" in dashboard/events/[id]/page.tsx, wo beide
// bereits so getrennt gepflegt werden.
export type LocationPatch = Partial<{
  locationName: string;
  locationAddress: string;
  locationLat: number | null;
  locationLng: number | null;
}>;

export function LocationQuickEdit({
  apiKey,
  locationName,
  locationAddress,
  onChange,
}: {
  apiKey: string | undefined;
  locationName: string;
  locationAddress: string;
  onChange: (patch: LocationPatch) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Name der Location
        <input
          type="text"
          value={locationName}
          placeholder="z. B. Schloss Ehrenfels"
          onChange={(e) => onChange({ locationName: e.target.value })}
          style={fieldStyle}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
        Adresse
        {apiKey ? (
          <PlaceAutocompleteField
            apiKey={apiKey}
            value={locationAddress}
            placeholder="Adresse eingeben und Vorschlag auswählen"
            onChange={(text) => onChange({ locationAddress: text, locationLat: null, locationLng: null })}
            onPlaceSelected={(place) => onChange({ locationAddress: place.address, locationLat: place.lat, locationLng: place.lng })}
            style={fieldStyle}
          />
        ) : (
          <input
            type="text"
            value={locationAddress}
            onChange={(e) => onChange({ locationAddress: e.target.value, locationLat: null, locationLng: null })}
            style={fieldStyle}
          />
        )}
      </label>
    </div>
  );
}
