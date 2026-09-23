"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CameraSection } from "@/components/invitation-sections/CameraSection";
import { SectionInlineControls } from "@/components/editor/SectionInlineControls";
import { sectionOrderIndex } from "@/lib/section-order";
import type { LiveDesignState } from "@/lib/live-design-state";

// Inline Ein-/Ausblenden + Umsortieren direkt am Abschnitt fuer die ECHTE
// Gaeste-Seite (Pendant zur Inline-Steuerung in DesignStudio.tsx) — ersetzt
// <CameraSection style={{order: sectionOrderIndex(key)}}> 1:1 an den 14
// umsortierbaren Modul-Abschnitten (Ablaufplan, Zusagen, Sitzplan, Menü,
// Galerie, Gästebuch, Trauzeugen, Musikwünsche, Wunschliste, Dresscode,
// Social Media, Audio-/Video-Einladung, Dankeskarte).
//
// Umsortieren bleibt komplett client-seitig live (wie ein Textstil-Patch):
// diese Komponente kennt bereits alle GERADE SICHTBAREN Geschwister
// (visibleKeys, server-berechnet in e/[slug]/page.tsx) und berechnet beim
// Klick das komplette neue sectionOrder-Array selbst — tauscht dabei mit
// dem naechsten SICHTBAREN Nachbarn, nicht dem naechsten Array-Eintrag
// (der koennte gerade ausgeblendet sein, ein Tausch damit haette keine
// sichtbare Wirkung). Das fertige Array geht per postMessage ans Dashboard
// (DesignEditor.tsx), das es 1:1 uebernimmt — keine doppelte "wer ist
// sichtbar"-Logik dort noetig.
//
// Ausblenden ist bewusst NICHT live: es schaltet ein echtes EventModule
// aus (dieselbe Wirkung wie der bestehende "Aktiv — ausschalten"-Button),
// das Dashboard laedt danach das Vorschau-iframe neu, damit Server und
// Anzeige garantiert wieder uebereinstimmen — einfacher und robuster als
// eine zweite Live-Leitung nur fuers Sichtbarkeits-Ein/Aus zu bauen.
export function ReorderableSection({
  sectionKey,
  label,
  editMode,
  fallbackOrder,
  initialOrder,
  visibleKeys,
  children,
}: {
  sectionKey: string;
  label: string;
  editMode: boolean;
  fallbackOrder: number;
  initialOrder: string[];
  visibleKeys: string[];
  children: ReactNode;
}) {
  const [order, setOrder] = useState<string[]>(initialOrder);

  useEffect(() => {
    if (!editMode) return;
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      const state = event.data.state as LiveDesignState;
      if (Array.isArray(state.sectionOrder)) setOrder(state.sectionOrder);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode]);

  const liveOrderValue = order.includes(sectionKey) ? sectionOrderIndex(order, sectionKey) : fallbackOrder;

  const visibleSorted = [...visibleKeys].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const visibleIndex = visibleSorted.indexOf(sectionKey);

  function move(direction: "up" | "down") {
    const swapWith = direction === "up" ? visibleIndex - 1 : visibleIndex + 1;
    if (swapWith < 0 || swapWith >= visibleSorted.length) return;
    const neighborKey = visibleSorted[swapWith];
    const next = [...order];
    const idxA = next.indexOf(sectionKey);
    const idxB = next.indexOf(neighborKey);
    if (idxA === -1 || idxB === -1) return;
    [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
    setOrder(next);
    window.parent.postMessage({ type: "einladi-section-reorder-request", order: next }, window.location.origin);
  }

  function hide() {
    window.parent.postMessage({ type: "einladi-section-hide-request", key: sectionKey }, window.location.origin);
  }

  return (
    // `order` MUSS auf diesem aeusseren div sitzen, nicht auf der inneren
    // CameraSection: `main` (der Gaeste-Seite) ist der Flex-Container, und
    // CSS `order` wirkt nur auf DIREKTE Flex-Kinder. Vorher stand `order`
    // auf <CameraSection>, einer Enkel-Ebene — dort war es fuer das Layout
    // komplett wirkungslos, alle 14 umsortierbaren Abschnitte hatten
    // dadurch effektiv order:0 und rutschten vor Hero (order:1) und Paar-
    // Vorstellung/Kennenlerngeschichte (order:2/4). Live mit Playwright
    // nachgewiesen (getComputedStyle des tatsaechlichen Flex-Kindes).
    <div style={{ position: "relative", order: liveOrderValue }}>
      {editMode && (
        <SectionInlineControls
          label={label}
          isFirst={visibleIndex <= 0}
          isLast={visibleIndex === visibleSorted.length - 1}
          onMoveUp={() => move("up")}
          onMoveDown={() => move("down")}
          onHide={hide}
        />
      )}
      <CameraSection>{children}</CameraSection>
    </div>
  );
}
