"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FONT_OPTIONS } from "@/lib/fonts";
import { TEXT_ELEMENT_LABELS, TEXT_ELEMENT_KEYS, type StyleElements, type TextElementKey, type TextElementStyle } from "@/lib/text-style";
import type { LiveDesignState } from "@/components/public/HeroCard";
import { TextControls } from "@/components/editor/TextControls";
import { DateQuickEdit } from "@/components/editor/DateQuickEdit";
import { ContextPanel } from "@/components/editor/ContextPanel";
import { EnvelopeTab } from "@/components/dashboard/panels/EnvelopeTab";
import { MusicTab } from "@/components/dashboard/panels/MusicTab";

const PANEL_TABS = [
  { id: "design", label: "Karten-Design" },
  { id: "envelope", label: "Umschlag-Design" },
  { id: "music", label: "Hintergrundmusik" },
];

type Colors = { primary: string; accent: string; background: string };

// Ersetzt die fruehere Kombination aus AutoSubmitForm + saveDesign-Server-
// Action + LivePreviewFrame-Remount (frameKey enthielt colorOverride/
// styleJson, jede Aenderung liess den Vorschau-iframe komplett neu laden —
// "kompletter Neustart" laut Nutzer-Feedback). Stattdessen: jede Aenderung
// aktualisiert lokalen State, schickt ihn per postMessage SOFORT in den
// iframe (HeroCard.tsx dort hoert darauf und rendert live neu, ohne
// Reload), und speichert separat, entprellt, im Hintergrund ueber
// /dashboard/events/[id]/design (gleiches Muster wie inline-text/route.ts
// fuer Titel/Untertitel).
export function DesignEditor({
  eventId,
  eventSlug,
  initialColors,
  initialFontId,
  initialOrnaments,
  initialElements,
  initialEventDate,
  initialEventTime,
  hasOverride,
  onReset,
  envelopeVideoUrl,
  uploadEnvelopeVideoAction,
  removeEnvelopeVideoAction,
  backgroundMusicUrl,
  uploadBackgroundMusicAction,
  removeBackgroundMusicAction,
}: {
  eventId: string;
  eventSlug: string;
  initialColors: Colors;
  initialFontId: string | undefined;
  initialOrnaments: boolean;
  initialElements: StyleElements | undefined;
  initialEventDate: string;
  initialEventTime: string;
  hasOverride: boolean;
  onReset: () => Promise<void>;
  envelopeVideoUrl: string | null;
  uploadEnvelopeVideoAction: (formData: FormData) => void;
  removeEnvelopeVideoAction: (formData: FormData) => void;
  backgroundMusicUrl: string | null;
  uploadBackgroundMusicAction: (formData: FormData) => void;
  removeBackgroundMusicAction: (formData: FormData) => void;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<LiveDesignState>({
    colors: initialColors,
    fontId: initialFontId,
    ornaments: initialOrnaments,
    elements: initialElements,
  });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedKey, setSelectedKey] = useState<TextElementKey | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("design");

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  // Klick-Auswahl auf der Karte (siehe HeroCard.tsx, selectElement()) steuert
  // von dort aus, welches Element hier im Panel bearbeitbar ist — die Karte
  // ist die alleinige Quelle der Auswahl, dieses Panel spiegelt sie nur.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-element-selected") return;
      setSelectedKey(event.data.key as TextElementKey);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Titel/Untertitel/Beschreibung werden weiterhin direkt im iframe per
  // InlineEditableText gespeichert (siehe HeroCard.tsx) — die meldet sich
  // per postMessage zurueck, damit die umgebende Dashboard-Seite (Titel-
  // Ueberschrift, "Details bearbeiten") sich synchronisiert. Gleiches
  // Muster wie zuvor in LivePreviewFrame.tsx.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "einladi-inline-saved") router.refresh();
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  function pushLive(next: LiveDesignState) {
    setState(next);
    iframeRef.current?.contentWindow?.postMessage({ type: "einladi-style-preview", state: next }, window.location.origin);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const body: Record<string, string | boolean> = {
        primary: next.colors.primary,
        accent: next.colors.accent,
        background: next.colors.background,
        fontId: next.fontId ?? "",
        ornaments: next.ornaments,
      };
      for (const key of TEXT_ELEMENT_KEYS) {
        const el = next.elements?.[key];
        if (el?.size) body[`${key}Size`] = el.size;
        if (el?.color) {
          body[`${key}ColorOn`] = true;
          body[`${key}Color`] = el.color;
        }
        if (el?.fontId) body[`${key}FontId`] = el.fontId;
        if (el?.align) body[`${key}Align`] = el.align;
        if (el?.bold) body[`${key}Bold`] = true;
        if (el?.underline) body[`${key}Underline`] = true;
        if (el?.strikethrough) body[`${key}Strikethrough`] = true;
        if (el?.italic) body[`${key}Italic`] = true;
      }
      fetch(`/dashboard/events/${eventId}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {
        // still verworfen — naechste Aenderung sendet den aktuellen Stand ohnehin erneut
      });
    }, 400);
  }

  function setColor(key: keyof Colors, value: string) {
    pushLive({ ...state, colors: { ...state.colors, [key]: value } });
  }

  function setFont(id: string) {
    pushLive({ ...state, fontId: id || undefined });
  }

  function setOrnaments(value: boolean) {
    pushLive({ ...state, ornaments: value });
  }

  function setElementStyle(key: TextElementKey, patch: Partial<TextElementStyle>) {
    const elements = { ...state.elements, [key]: { ...state.elements?.[key], ...patch } };
    pushLive({ ...state, elements });
  }

  // Datum/Uhrzeit sind eigene Event-Spalten, nicht Teil von colorOverride/
  // styleJson — deshalb eigener Speicherpfad (/date statt /design), aber
  // dieselbe postMessage/State-Mechanik: beides landet gemeinsam in einem
  // LiveDesignState-Objekt, das HeroCard.tsx als Ganzes empfaengt.
  const dateSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pushDate(next: { eventDate: string; eventTime: string }) {
    const nextState: LiveDesignState = { ...state, eventDateIso: new Date(next.eventDate).toISOString(), eventTime: next.eventTime || null };
    setState(nextState);
    iframeRef.current?.contentWindow?.postMessage({ type: "einladi-style-preview", state: nextState }, window.location.origin);

    if (dateSaveTimeout.current) clearTimeout(dateSaveTimeout.current);
    dateSaveTimeout.current = setTimeout(() => {
      fetch(`/dashboard/events/${eventId}/date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventDate: next.eventDate, eventTime: next.eventTime || null }),
      }).catch(() => {
        // still verworfen — naechste Aenderung sendet den aktuellen Stand ohnehin erneut
      });
    }, 400);
  }

  const currentEventDate = state.eventDateIso ? state.eventDateIso.slice(0, 10) : initialEventDate;
  const currentEventTime = state.eventTime !== undefined ? (state.eventTime ?? "") : initialEventTime;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 480px", minWidth: 280, order: 1 }}>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>
          Tipp: Titel, Untertitel und Beschreibung direkt in der Vorschau anklicken und bearbeiten.
        </div>
        <div className="card" style={{ height: "min(82vh, 920px)", minHeight: 560 }}>
          <iframe ref={iframeRef} title="Vorschau der Einladungsseite" src={`/e/${eventSlug}?dashboardPreview=1`} style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      </div>
      <div className="editor-panel-sticky" style={{ flex: "0 0 280px", minWidth: 260, order: 2 }}>
        <ContextPanel tabs={PANEL_TABS} activeTabId={activeTab} onTabChange={setActiveTab}>
          {activeTab === "envelope" ? (
            <EnvelopeTab
              eventId={eventId}
              envelopeVideoUrl={envelopeVideoUrl}
              uploadAction={uploadEnvelopeVideoAction}
              removeAction={removeEnvelopeVideoAction}
            />
          ) : activeTab === "music" ? (
            <MusicTab
              eventId={eventId}
              backgroundMusicUrl={backgroundMusicUrl}
              uploadAction={uploadBackgroundMusicAction}
              removeAction={removeBackgroundMusicAction}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Primär (Text)
                <input type="color" value={state.colors.primary} onChange={(e) => setColor("primary", e.target.value)} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Akzent
                <input type="color" value={state.colors.accent} onChange={(e) => setColor("accent", e.target.value)} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Hintergrund
                <input type="color" value={state.colors.background} onChange={(e) => setColor("background", e.target.value)} style={{ width: "100%", height: 40, border: "1px solid var(--line)", cursor: "pointer" }} />
              </label>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
                Schriftart
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))", gap: 6 }}>
                  <label className="customizer-font-btn" style={{ display: "block", cursor: "pointer", position: "relative" }}>
                    <input type="radio" name="fontId" checked={!state.fontId} onChange={() => setFont("")} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontStyle: "italic" }}>Aa</span>
                    <small style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 9.5, marginTop: 4 }}>Standard</small>
                  </label>
                  {FONT_OPTIONS.map((f) => (
                    <label key={f.id} className="customizer-font-btn" style={{ display: "block", cursor: "pointer", position: "relative" }}>
                      <input type="radio" name="fontId" checked={state.fontId === f.id} onChange={() => setFont(f.id)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                      <span style={{ display: "block", fontFamily: f.cssVar, fontStyle: f.italic ? "italic" : "normal", textTransform: f.uppercase ? "uppercase" : "none" }}>Aa</span>
                      <small style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 9.5, marginTop: 4 }}>{f.label}</small>
                    </label>
                  ))}
                </div>
              </div>

              <label className="customizer-toggle">
                <input type="checkbox" checked={state.ornaments} onChange={(e) => setOrnaments(e.target.checked)} />
                <span className="customizer-switch" aria-hidden="true" />
                <span className="customizer-toggle-text">Verzierungen (Eck-Ornamente) anzeigen</span>
              </label>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
                {selectedKey === "date" ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{TEXT_ELEMENT_LABELS.date}</div>
                      <button
                        type="button"
                        onClick={() => setSelectedKey(undefined)}
                        style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >
                        Abwählen
                      </button>
                    </div>
                    <DateQuickEdit eventDate={currentEventDate} eventTime={currentEventTime} onChange={pushDate} />
                  </>
                ) : selectedKey ? (
                  <TextControls
                    elementKey={selectedKey}
                    label={TEXT_ELEMENT_LABELS[selectedKey]}
                    style={state.elements?.[selectedKey] ?? {}}
                    defaultColor={state.colors.primary}
                    onChange={(patch) => setElementStyle(selectedKey, patch)}
                    onDeselect={() => setSelectedKey(undefined)}
                  />
                ) : (
                  <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                    Klicke Anlass-Label, Titel, Untertitel, Familiennamen, Datum oder Beschreibung direkt in der
                    Vorschau an, um genau diesen Text einzustellen.
                  </div>
                )}
              </div>

              <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Änderungen werden automatisch gespeichert.</span>

              {hasOverride && (
                <button type="button" onClick={onReset} className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 12, width: "100%" }}>
                  Zurücksetzen auf Vorlage
                </button>
              )}
            </div>
          )}
        </ContextPanel>
      </div>
    </div>
  );
}
