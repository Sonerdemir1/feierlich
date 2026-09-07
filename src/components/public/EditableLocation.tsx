"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import type { LiveDesignState } from "@/components/public/HeroCard";

// Duenner Client-Wrapper, weil e/[slug]/page.tsx (Server Component) die
// "Ort"-Sektion ausserhalb von HeroCard.tsx rendert (eigener Abschnitt
// unter der Karte, siehe EditableDescription.tsx fuer dasselbe Muster).
// Anders als bei Beschreibung/Titel/etc. passiert die eigentliche
// Bearbeitung hier NICHT inline per contentEditable (eine Adresse braucht
// Places-Autocomplete, kein Freitext) — deshalb "kind=date"-Verhalten wie
// bei der Datumszeile: Klick waehlt nur aus, das Kontext-Panel im
// Dashboard-Editor (LocationQuickEdit.tsx) macht die eigentliche
// Aenderung und schickt sie per postMessage hierher zurueck, damit die
// Anzeige ohne Reload live mitzieht.
export function EditableLocation({
  initialLocationName,
  initialLocationAddress,
  headingStyle,
  addressStyle,
}: {
  initialLocationName: string | null;
  initialLocationAddress: string | null;
  headingStyle: CSSProperties;
  addressStyle: CSSProperties;
}) {
  const [selected, setSelected] = useState(false);
  const [live, setLive] = useState<{ locationName?: string | null; locationAddress?: string | null }>({});

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      if (state.locationName === undefined && state.locationAddress === undefined) return;
      setLive({ locationName: state.locationName, locationAddress: state.locationAddress });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const locationName = live.locationName !== undefined ? live.locationName : initialLocationName;
  const locationAddress = live.locationAddress !== undefined ? live.locationAddress : initialLocationAddress;

  useSelectionBroadcast(useCallback((identity) => setSelected(identity === "location"), []));

  function select() {
    broadcastSelection("location");
    window.parent.postMessage({ type: "einladi-element-selected", key: "location" }, window.location.origin);
  }

  return (
    <SelectableElement kind="date" label="Ort / Location" selected={selected} onSelect={select}>
      <div style={headingStyle}>
        {locationName || "Ort / Location hinzufügen…"}
      </div>
      {locationAddress && <div style={addressStyle}>{locationAddress}</div>}
    </SelectableElement>
  );
}
