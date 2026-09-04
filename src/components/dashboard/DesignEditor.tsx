"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FONT_OPTIONS } from "@/lib/fonts";
import { ELEMENT_SIZE_PRESETS, TEXT_ELEMENT_LABELS, TEXT_ELEMENT_KEYS, type StyleElements, type TextElementKey } from "@/lib/text-style";
import type { LiveDesignState } from "@/components/public/HeroCard";

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
  hasOverride,
  onReset,
}: {
  eventId: string;
  eventSlug: string;
  initialColors: Colors;
  initialFontId: string | undefined;
  initialOrnaments: boolean;
  initialElements: StyleElements | undefined;
  hasOverride: boolean;
  onReset: () => Promise<void>;
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

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
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

  function setElementSize(key: TextElementKey, size: string) {
    const elements = { ...state.elements, [key]: { ...state.elements?.[key], size: size === "md" ? undefined : size } };
    pushLive({ ...state, elements });
  }

  function setElementColor(key: TextElementKey, on: boolean, color: string) {
    const elements = { ...state.elements, [key]: { ...state.elements?.[key], color: on ? color : undefined } };
    pushLive({ ...state, elements });
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
      <div style={{ flex: "0 0 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 12 }}>
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
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>Text-Feinsteuerung</div>
          <div style={{ fontSize: 11, color: "var(--ink-faint)", marginBottom: 10 }}>
            Größe &amp; Farbe für jeden Text einzeln — wirkt sofort auf die Vorschau.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TEXT_ELEMENT_KEYS.map((key) => {
              const el = state.elements?.[key];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ flex: "1 1 auto", fontSize: 12, color: "var(--ink-soft)" }}>{TEXT_ELEMENT_LABELS[key]}</span>
                  <select
                    value={el?.size ?? "md"}
                    onChange={(e) => setElementSize(key, e.target.value)}
                    style={{ padding: "7px 8px", border: "1px solid var(--line)", background: "var(--ivory-2)", fontSize: 11.5 }}
                  >
                    {ELEMENT_SIZE_PRESETS[key].map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <label title="Eigene Farbe verwenden (sonst folgt der Text der globalen Primär-Farbe oben)" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(el?.color)}
                      onChange={(e) => setElementColor(key, e.target.checked, el?.color ?? state.colors.primary)}
                      style={{ marginRight: 4 }}
                    />
                  </label>
                  <input
                    type="color"
                    value={el?.color ?? state.colors.primary}
                    onChange={(e) => setElementColor(key, true, e.target.value)}
                    style={{ width: 34, height: 30, border: "1px solid var(--line)", cursor: "pointer", padding: 0 }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Änderungen werden automatisch gespeichert.</span>

        {hasOverride && (
          <button type="button" onClick={onReset} className="btn btn-ghost" style={{ padding: "9px 14px", fontSize: 12, width: "100%" }}>
            Zurücksetzen auf Vorlage
          </button>
        )}
      </div>
      <div style={{ flex: "1 1 360px", minWidth: 260 }}>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 8 }}>
          Tipp: Titel, Untertitel und Beschreibung direkt in der Vorschau anklicken und bearbeiten.
        </div>
        <div className="card" style={{ height: 480, overflow: "hidden" }}>
          <iframe ref={iframeRef} title="Vorschau der Einladungsseite" src={`/e/${eventSlug}?dashboardPreview=1`} style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      </div>
    </div>
  );
}
