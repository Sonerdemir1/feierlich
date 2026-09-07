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
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: "1 1 0",
              padding: "8px 6px",
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
