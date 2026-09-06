"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FONT_OPTIONS } from "@/lib/fonts";
import { TEXT_ELEMENT_LABELS, TEXT_ELEMENT_KEYS, type StyleElements, type TextElementKey, type TextElementStyle } from "@/lib/text-style";
import type { LiveDesignState } from "@/components/public/HeroCard";
import { TextControls } from "@/components/editor/TextControls";
import { DateQuickEdit } from "@/components/editor/DateQuickEdit";
import { LocationQuickEdit, type LocationPatch } from "@/components/editor/LocationQuickEdit";
import { AgendaItemQuickEdit } from "@/components/editor/AgendaItemQuickEdit";
import { newAgendaItem, moveAgendaItem, type AgendaItem } from "@/lib/agenda";
import { WishlistItemQuickEdit } from "@/components/editor/WishlistItemQuickEdit";
import { newWishlistItem, moveWishlistItem, type WishlistItemData } from "@/lib/wishlist";
import { GOOGLE_MAPS_API_KEY } from "@/lib/google-maps";
import { ContextPanel } from "@/components/editor/ContextPanel";
import { EnvelopeTab } from "@/components/dashboard/panels/EnvelopeTab";
import { MusicTab } from "@/components/dashboard/panels/MusicTab";
import { AudioInvitationTab } from "@/components/dashboard/panels/AudioInvitationTab";
import { VideoMessageTab } from "@/components/dashboard/panels/VideoMessageTab";

const PANEL_TABS = [
  { id: "design", label: "Karten-Design" },
  { id: "envelope", label: "Umschlag-Design" },
  { id: "music", label: "Hintergrundmusik" },
  { id: "audio-invitation", label: "Audio-Einladung" },
  { id: "video-message", label: "Video-Einladung" },
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
  initialLocationName,
  initialLocationAddress,
  initialAgendaItems,
  initialWishlistItems,
  hasOverride,
  onReset,
  envelopeVideoUrl,
  uploadEnvelopeVideoAction,
  removeEnvelopeVideoAction,
  backgroundMusicUrl,
  uploadBackgroundMusicAction,
  removeBackgroundMusicAction,
  audioInvitationUrl,
  uploadAudioInvitationAction,
  removeAudioInvitationAction,
  videoMessageUrl,
  uploadVideoMessageAction,
  removeVideoMessageAction,
}: {
  eventId: string;
  eventSlug: string;
  initialColors: Colors;
  initialFontId: string | undefined;
  initialOrnaments: boolean;
  initialElements: StyleElements | undefined;
  initialEventDate: string;
  initialEventTime: string;
  initialLocationName: string;
  initialLocationAddress: string;
  initialAgendaItems: AgendaItem[];
  initialWishlistItems: WishlistItemData[];
  hasOverride: boolean;
  onReset: () => Promise<void>;
  envelopeVideoUrl: string | null;
  uploadEnvelopeVideoAction: (formData: FormData) => void;
  removeEnvelopeVideoAction: (formData: FormData) => void;
  backgroundMusicUrl: string | null;
  uploadBackgroundMusicAction: (formData: FormData) => void;
  removeBackgroundMusicAction: (formData: FormData) => void;
  audioInvitationUrl: string | null;
  uploadAudioInvitationAction: (formData: FormData) => void;
  removeAudioInvitationAction: (formData: FormData) => void;
  videoMessageUrl: string | null;
  uploadVideoMessageAction: (formData: FormData) => void;
  removeVideoMessageAction: (formData: FormData) => void;
}) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<LiveDesignState>({
    colors: initialColors,
    fontId: initialFontId,
    ornaments: initialOrnaments,
    elements: initialElements,
    agendaItems: initialAgendaItems,
    wishlistItems: initialWishlistItems,
  });
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedKey, setSelectedKey] = useState<TextElementKey | undefined>(undefined);
  // Wie selectedAgendaId in DesignStudio.tsx: eine variable Liste hat keinen
  // festen TextElementKey, jeder Eintrag braucht seine eigene id zusaetzlich
  // zu selectedKey === "agenda".
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string | undefined>(undefined);
  const [selectedWishlistItemId, setSelectedWishlistItemId] = useState<string | undefined>(undefined);
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
      const key = event.data.key as string;
      // "wishlist" ist bewusst KEIN TextElementKey (siehe lib/wishlist.ts —
      // ein Wunschartikel hat keinen eigenen Stil, also braucht es auch
      // keine TextControls-Anbindung darueber) — deshalb eigener Zweig statt
      // wie bei "agenda" einfach durchzureichen.
      if (key === "wishlist") {
        setSelectedKey(undefined);
        setSelectedAgendaItemId(undefined);
        setSelectedWishlistItemId(event.data.itemId as string);
      } else {
        setSelectedKey(key as TextElementKey);
        setSelectedAgendaItemId(key === "agenda" ? (event.data.itemId as string) : undefined);
        setSelectedWishlistItemId(undefined);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Hinzufuegen/Entfernen/Umsortieren werden von EditableAgenda.tsx nur als
  // Wunsch nach oben gemeldet (siehe Kommentar dort) — die eigentliche
  // Listenberechnung passiert hier, auf demselben state.agendaItems, das
  // auch das Panel fuer Uhrzeit/Bezeichnung/Stil-Aenderungen nutzt. So gibt
  // es nur eine einzige Quelle der Wahrheit statt zweier auseinanderlaufender Kopien.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-agenda-request") return;
      const current = state.agendaItems ?? [];
      const { action, itemId, direction } = event.data as { action: string; itemId?: string; direction?: "up" | "down" };
      if (action === "add") {
        const item = newAgendaItem();
        pushAgenda([...current, item]);
        setSelectedKey("agenda");
        setSelectedAgendaItemId(item.id);
      } else if (action === "remove" && itemId) {
        pushAgenda(current.filter((it) => it.id !== itemId));
        if (selectedAgendaItemId === itemId) {
          setSelectedKey(undefined);
          setSelectedAgendaItemId(undefined);
        }
      } else if (action === "move" && itemId && direction) {
        pushAgenda(moveAgendaItem(current, itemId, direction));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pushAgenda liest/schreibt ueber state per Closure, absichtlich bei jeder Aenderung neu registriert (naechster Abschnitt)
  }, [state.agendaItems, selectedAgendaItemId]);

  // Analog zum Ablaufplan-Request-Effekt oben, fuer die Wunschliste (siehe
  // EditableWishlist.tsx) — echte WishlistItem-Zeilen statt eines JSON-Bags,
  // aber dieselbe "Liste lebt hier, Karte meldet nur Wuensche"-Architektur.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-wishlist-request") return;
      const current = state.wishlistItems ?? [];
      const { action, itemId, direction } = event.data as { action: string; itemId?: string; direction?: "up" | "down" };
      if (action === "add") {
        const item = newWishlistItem();
        pushWishlist([...current, item]);
        setSelectedKey(undefined);
        setSelectedWishlistItemId(item.id);
      } else if (action === "remove" && itemId) {
        pushWishlist(current.filter((it) => it.id !== itemId));
        if (selectedWishlistItemId === itemId) {
          setSelectedKey(undefined);
          setSelectedWishlistItemId(undefined);
        }
      } else if (action === "move" && itemId && direction) {
        pushWishlist(moveWishlistItem(current, itemId, direction));
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pushWishlist liest/schreibt ueber state per Closure, absichtlich bei jeder Aenderung neu registriert (naechster Abschnitt)
  }, [state.wishlistItems, selectedWishlistItemId]);

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

  const currentLocationName = state.locationName !== undefined ? (state.locationName ?? "") : initialLocationName;
  const currentLocationAddress = state.locationAddress !== undefined ? (state.locationAddress ?? "") : initialLocationAddress;

  // Location ist kein reines Text-Feld wie Titel/Familie (Adresse braucht
  // Places-Autocomplete + Koordinaten) — deshalb ein eigener Speicherpfad
  // wie bei pushDate() statt ueber buildDesignUpdate()/den Element-Style-Weg.
  const locationSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pushLocation(patch: LocationPatch) {
    const nextState: LiveDesignState = {
      ...state,
      locationName: patch.locationName ?? currentLocationName,
      locationAddress: patch.locationAddress ?? currentLocationAddress,
    };
    setState(nextState);
    iframeRef.current?.contentWindow?.postMessage({ type: "einladi-style-preview", state: nextState }, window.location.origin);

    if (locationSaveTimeout.current) clearTimeout(locationSaveTimeout.current);
    locationSaveTimeout.current = setTimeout(() => {
      fetch(`/dashboard/events/${eventId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: nextState.locationName,
          locationAddress: nextState.locationAddress,
          locationLat: patch.locationLat ?? null,
          locationLng: patch.locationLng ?? null,
        }),
      }).catch(() => {
        // still verworfen — naechste Aenderung sendet den aktuellen Stand ohnehin erneut
      });
    }, 400);
  }

  // Ablaufplan: anders als Datum/Location gibt es hier keinen eigenen
  // "initial* vs. state.x !== undefined"-Fallback, weil state.agendaItems
  // bereits beim useState(...)-Aufruf oben auf initialAgendaItems gesetzt
  // wurde — die Liste lebt von Anfang an vollstaendig in state.
  const agendaSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pushAgenda(items: AgendaItem[]) {
    const nextState: LiveDesignState = { ...state, agendaItems: items };
    setState(nextState);
    iframeRef.current?.contentWindow?.postMessage({ type: "einladi-style-preview", state: nextState }, window.location.origin);

    if (agendaSaveTimeout.current) clearTimeout(agendaSaveTimeout.current);
    agendaSaveTimeout.current = setTimeout(() => {
      fetch(`/dashboard/events/${eventId}/agenda`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {
        // still verworfen — naechste Aenderung sendet den aktuellen Stand ohnehin erneut
      });
    }, 400);
  }
  function updateAgendaItem(id: string, patch: Partial<AgendaItem>) {
    pushAgenda((state.agendaItems ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function updateAgendaItemStyle(id: string, patch: Partial<TextElementStyle>) {
    const current = (state.agendaItems ?? []).find((it) => it.id === id);
    updateAgendaItem(id, { style: { ...current?.style, ...patch } });
  }

  // Wunschliste: gleiches Push-Muster wie pushAgenda, speichert aber gegen
  // die echte WishlistItem-Tabelle (siehe /wishlist/route.ts) statt eines
  // JSON-Bags — fuer die Live-Vorschau/den Speicher-Rhythmus macht das
  // keinen Unterschied, beides ist "State hier, Server spiegelt entprellt".
  const wishlistSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pushWishlist(items: WishlistItemData[]) {
    const nextState: LiveDesignState = { ...state, wishlistItems: items };
    setState(nextState);
    iframeRef.current?.contentWindow?.postMessage({ type: "einladi-style-preview", state: nextState }, window.location.origin);

    if (wishlistSaveTimeout.current) clearTimeout(wishlistSaveTimeout.current);
    wishlistSaveTimeout.current = setTimeout(() => {
      fetch(`/dashboard/events/${eventId}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {
        // still verworfen — naechste Aenderung sendet den aktuellen Stand ohnehin erneut
      });
    }, 400);
  }
  function updateWishlistItem(id: string, patch: Partial<WishlistItemData>) {
    pushWishlist((state.wishlistItems ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)));
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
          ) : activeTab === "audio-invitation" ? (
            <AudioInvitationTab
              eventId={eventId}
              audioInvitationUrl={audioInvitationUrl}
              uploadAction={uploadAudioInvitationAction}
              removeAction={removeAudioInvitationAction}
            />
          ) : activeTab === "video-message" ? (
            <VideoMessageTab
              eventId={eventId}
              videoMessageUrl={videoMessageUrl}
              uploadAction={uploadVideoMessageAction}
              removeAction={removeVideoMessageAction}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Ausgewaehltes Element steht ZUERST im Panel (wie in
                  DesignStudio.tsx) — Klick auf ein Kartenelement soll das
                  Panel sofort, ohne Scrollen, auf genau dieses Element
                  ausrichten. "Abwählen" (bzw. der onDeselect-Callback der
                  TextControls) fuehrt zurueck zum allgemeinen Karten-
                  Design-Bereich darunter. */}
              {selectedKey === "date" ? (
                <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 4 }}>
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
                </div>
              ) : selectedKey === "location" ? (
                <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 4 }}>
                  <LocationQuickEdit
                    apiKey={GOOGLE_MAPS_API_KEY}
                    locationName={currentLocationName}
                    locationAddress={currentLocationAddress}
                    onChange={pushLocation}
                  />
                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                    <TextControls
                      elementKey="location"
                      label={TEXT_ELEMENT_LABELS.location}
                      style={state.elements?.location ?? {}}
                      defaultColor={state.colors.primary}
                      onChange={(patch) => setElementStyle("location", patch)}
                      onDeselect={() => setSelectedKey(undefined)}
                    />
                  </div>
                </div>
              ) : selectedKey === "agenda" && selectedAgendaItemId ? (
                (() => {
                  const item = (state.agendaItems ?? []).find((it) => it.id === selectedAgendaItemId);
                  if (!item) return null;
                  return (
                    <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 4 }}>
                      <TextControls
                        elementKey="agenda"
                        label={TEXT_ELEMENT_LABELS.agenda}
                        style={item.style ?? {}}
                        defaultColor={state.colors.primary}
                        onChange={(patch) => updateAgendaItemStyle(item.id, patch)}
                        onDeselect={() => {
                          setSelectedKey(undefined);
                          setSelectedAgendaItemId(undefined);
                        }}
                      />
                      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                        <AgendaItemQuickEdit
                          time={item.time}
                          label={item.label}
                          onChange={(patch) => updateAgendaItem(item.id, patch)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            pushAgenda((state.agendaItems ?? []).filter((it) => it.id !== item.id));
                            setSelectedKey(undefined);
                            setSelectedAgendaItemId(undefined);
                          }}
                          className="btn btn-ghost"
                          style={{ marginTop: 12, padding: "8px 14px", fontSize: 12, width: "100%" }}
                        >
                          Eintrag löschen
                        </button>
                      </div>
                    </div>
                  );
                })()
              ) : selectedWishlistItemId ? (
                (() => {
                  const item = (state.wishlistItems ?? []).find((it) => it.id === selectedWishlistItemId);
                  if (!item) return null;
                  return (
                    <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>Wunschlisten-Artikel</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedKey(undefined);
                            setSelectedWishlistItemId(undefined);
                          }}
                          style={{ fontSize: 11, color: "var(--ink-faint)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          Abwählen
                        </button>
                      </div>
                      <WishlistItemQuickEdit
                        type={item.type}
                        title={item.title}
                        description={item.description}
                        url={item.url}
                        onChange={(patch) => updateWishlistItem(item.id, patch)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          pushWishlist((state.wishlistItems ?? []).filter((it) => it.id !== item.id));
                          setSelectedKey(undefined);
                          setSelectedWishlistItemId(undefined);
                        }}
                        className="btn btn-ghost"
                        style={{ marginTop: 12, padding: "8px 14px", fontSize: 12, width: "100%" }}
                      >
                        Artikel löschen
                      </button>
                    </div>
                  );
                })()
              ) : selectedKey ? (
                <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: 12, marginBottom: 4 }}>
                  <TextControls
                    elementKey={selectedKey}
                    label={TEXT_ELEMENT_LABELS[selectedKey]}
                    style={state.elements?.[selectedKey] ?? {}}
                    defaultColor={state.colors.primary}
                    onChange={(patch) => setElementStyle(selectedKey, patch)}
                    onDeselect={() => setSelectedKey(undefined)}
                  />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
                  Klicke Anlass-Label, Titel, Untertitel, Familiennamen, Datum, Ort, Ablaufplan-Eintraege,
                  Gästebuch-, Wunschlisten-, Musikwünsche-, Countdown-, Kalender-, Zusagen-, Sitzplan-,
                  Galerie-, Dresscode-, Social-Media-, Menükarte-, Dankeskarte-, Audio- oder Video-Einladung-
                  Texte direkt in der Vorschau an, um genau dieses Element einzustellen.
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginTop: 4 }}>Karten-Design</div>
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
