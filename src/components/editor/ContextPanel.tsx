import type { ReactNode } from "react";

// Tab-Kopf fuers Kontext-Panel (Karten-Design/Umschlag-Design/
// Hintergrundmusik, siehe Umsetzungsplan Phase 5) — reine Praesentation,
// haelt den aktiven Tab NICHT selbst (DesignEditor.tsx besitzt den State,
// damit ein Tab-Wechsel z.B. eine laufende Klick-Auswahl auf der Karte
// nicht verliert).
export function ContextPanel({
  tabs,
  activeTabId,
  onTabChange,
  children,
}: {
  tabs: { id: string; label: string }[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div>
      {/* Bugfix: bei 6 Tabs (Karten-Design/Details/Umschlag-Design/
          Hintergrundmusik/Audio-Einladung/Video-Einladung) reichte die
          Panel-Breite nicht — "flex: 1 1 0" kann Buttons nicht unter ihre
          eigene Text-Mindestbreite (laengstes zusammenhaengendes Wort,
          "Hintergrundmusik") schrumpfen, der Tab-Kopf lief dadurch aus
          seinem Container heraus. Die ueberstehenden Tabs (Audio-/Video-
          Einladung) lagen dann UNTER anderen Elementen (Kopfzeile, Panel-
          Ueberschrift) und waren per Klick komplett unerreichbar — live
          bestaetigt: elementFromPoint auf der Tab-Position traf jeweils ein
          fremdes Element, nicht den Tab-Button selbst. Ein erster Versuch
          mit erzwungenem Schrumpfen (minWidth:0) machte alle 6 zwar wieder
          klickbar, quetschte die Beschriftungen aber so eng aneinander,
          dass sich Nachbar-Tabs beim Zeilenumbruch optisch beruehrten/
          ueberlappten ("Hintergrundmusik" stiess direkt an "Audio-
          Einladung") — kaum noch lesbar. Stattdessen: horizontal
          scrollbarer Streifen mit fester Tab-Breite, jeder Tab behaelt
          seine natuerliche Lesbarkeit, ueberzaehlige Tabs sind ganz normal
          nach rechts wegscrollbar (bekanntes Muster, z. B. iOS-
          Einstellungen) statt unsichtbar zu ueberlappen. Betrifft sowohl
          DesignEditor.tsx (Dashboard) als auch DesignStudio.tsx (anonymes
          Gestalten) — beide nutzen diese gemeinsame Komponente. */}
      <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: "0 0 auto",
              minWidth: 78,
              whiteSpace: "nowrap",
              padding: "8px 10px",
              border: "none",
              borderBottom: `2px solid ${activeTabId === tab.id ? "var(--terracotta-dark)" : "transparent"}`,
              background: "none",
              color: activeTabId === tab.id ? "var(--ink)" : "var(--ink-faint)",
              fontWeight: activeTabId === tab.id ? 600 : 400,
              fontSize: 11.5,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
