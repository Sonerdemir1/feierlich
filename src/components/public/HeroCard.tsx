"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ElementType } from "react";
import { Countdown } from "@/components/public/Countdown";
import { EnvelopeReveal } from "@/components/marketing/EnvelopeReveal";
import { CornerMotif } from "@/components/marketing/TemplatePreview";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { fontOptionById } from "@/lib/fonts";
import { elementOverrideStyle, type StyleElements, type TextElementKey } from "@/lib/text-style";
import { broadcastSelection, useSelectionBroadcast } from "@/lib/local-selection";
import type { AgendaItem } from "@/lib/agenda";
import type { WishlistItemData } from "@/lib/wishlist";

type Colors = { primary: string; accent: string; background: string };
type TextZone = { top: number; right: number; bottom: number; left: number };

export type LiveDesignState = {
  colors: Colors;
  fontId?: string;
  ornaments: boolean;
  elements?: StyleElements;
  // Live-Override fuers Datum (DateQuickEdit.tsx, Phase 3) — undefined laesst
  // die serverseitig berechneten eventDate/eventTime-Props unangetastet,
  // gesetzt aktualisiert Datumszeile + Countdown sofort ohne Seiten-Reload.
  eventDateIso?: string;
  eventTime?: string | null;
  // Live-Override fuer die Location (LocationQuickEdit.tsx) — wird von
  // HeroCard.tsx selbst nicht gerendert (die Karte zeigt keine Location,
  // siehe e/[slug]/page.tsx "Ort"-Sektion), aber ueber denselben
  // "einladi-style-preview"-Broadcast an EditableLocation.tsx weitergereicht,
  // die unabhaengig von HeroCard denselben State-Kanal mitliest.
  locationName?: string | null;
  locationAddress?: string | null;
  // Live-Override fuer den Ablaufplan (siehe EditableAgenda.tsx) — wie
  // locationName/-Address von HeroCard.tsx selbst nicht gerendert, aber
  // ueber denselben Broadcast an EditableAgenda.tsx weitergereicht.
  agendaItems?: AgendaItem[];
  // Live-Override fuer die Wunschliste (siehe EditableWishlist.tsx) — wie
  // agendaItems von HeroCard.tsx selbst nicht gerendert, aber ueber
  // denselben Broadcast weitergereicht (Schritt 4).
  wishlistItems?: WishlistItemData[];
};

// Eigenstaendige Client-Komponente statt eines reinen Server-Blocks: haelt
// Farben/Schriftart/Verzierungen/Pro-Element-Feinsteuerung in lokalem State
// statt sie einmalig serverseitig zu berechnen — dadurch kann DesignEditor.tsx
// im Dashboard per postMessage neue Werte reinschicken, die hier per
// setState sofort neu rendern, OHNE dass der Vorschau-iframe neu laedt
// (kein neuer HTTP-Request, keine wiederholte Umschlag-Animation). Nur
// aktiv im editMode (siehe e/[slug]/page.tsx) — echte Gaeste bekommen
// niemals eine postMessage und sehen exakt die serverseitig berechneten
// Startwerte, das Verhalten aendert sich fuer sie nicht.
export function HeroCard({
  eventId,
  eventSlug,
  title,
  subtitle,
  familyLeft,
  familyRight,
  eventDate,
  eventTime,
  eventLabelText,
  eventLabelRaw,
  eventTypeDefaultLabel,
  editMode,
  cardImageUrl,
  envelopeImages,
  textZone,
  hasFamilyNames,
  calendarUrl,
  countdownOn,
  templateFontFallback,
  initial,
  countdownDaysLabel,
  countdownHoursLabel,
  countdownMinutesLabel,
  calendarSaveText,
  calendarGoogleText,
}: {
  eventId: string;
  eventSlug: string;
  title: string;
  subtitle: string | null;
  familyLeft: string | null;
  familyRight: string | null;
  eventDate: Date;
  eventTime: string | null;
  eventLabelText: string;
  eventLabelRaw: string | null;
  eventTypeDefaultLabel: string;
  editMode: boolean;
  cardImageUrl: string | null;
  envelopeImages: string[] | null;
  textZone: TextZone;
  hasFamilyNames: boolean;
  calendarUrl: string;
  countdownOn: boolean;
  templateFontFallback: "var(--font-body)" | "var(--font-display)";
  initial: LiveDesignState;
  countdownDaysLabel: string;
  countdownHoursLabel: string;
  countdownMinutesLabel: string;
  calendarSaveText: string;
  calendarGoogleText: string;
}) {
  const [live, setLive] = useState<LiveDesignState>(initial);
  const [selectedKey, setSelectedKey] = useState<TextElementKey | undefined>(undefined);

  useEffect(() => {
    if (!editMode) return;
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "einladi-style-preview") return;
      setLive(event.data.state as LiveDesignState);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editMode]);

  // Klick-Auswahl auf der Karte: die Auswahl selbst lebt hier lokal (steuert
  // den Auswahl-Rahmen direkt am Element), das Kontext-Panel im Dashboard
  // (DesignEditor.tsx) wird nur per postMessage informiert, welches Element
  // gerade aktiv ist, und zeigt dafuer die passenden Controls — keine
  // Rueck-Synchronisation noetig, die Karte ist immer die Quelle der Auswahl.
  // Elemente AUSSERHALB von HeroCard.tsx (Ort, Beschreibung, Ablaufplan,
  // Gaestebuch, Wunschliste, Musikwuensche, RSVP) haben ihre eigene
  // Auswahl-Anzeige und wuerden ohne diesen Broadcast-Kanal (siehe
  // lib/local-selection.ts) faelschlich weiter selektiert bleiben, wenn
  // hier auf der Karte etwas anderes angeklickt wird — und umgekehrt: ohne
  // diesen Listener bliebe z.B. "Titel" hier selektiert, waehrend "Ort"
  // andernorts angeklickt wird. Gefunden waehrend Schritt 5 (RSVP).
  useSelectionBroadcast(useCallback((identity) => setSelectedKey(identity as TextElementKey), []));

  function selectElement(key: TextElementKey) {
    if (!editMode) return;
    setSelectedKey(key);
    broadcastSelection(key);
    window.parent.postMessage({ type: "einladi-element-selected", key }, window.location.origin);
  }

  const colors = live.colors;
  const chosenFont = fontOptionById(live.fontId);
  const headingFont = chosenFont?.cssVar ?? templateFontFallback;
  const headingItalic = chosenFont ? Boolean(chosenFont.italic) : headingFont === "var(--font-display)";
  const headingUppercase = Boolean(chosenFont?.uppercase);
  const showOrnaments = live.ornaments;
  const applyOrnamentFrame = showOrnaments && !cardImageUrl;

  const titleOverride = elementOverrideStyle(live.elements, "title");
  const subtitleOverride = elementOverrideStyle(live.elements, "subtitle");
  const dateOverride = elementOverrideStyle(live.elements, "date");
  const eventLabelOverride = elementOverrideStyle(live.elements, "eventLabel");
  const familyOverride = elementOverrideStyle(live.elements, "family");
  const countdownLabelOverride = elementOverrideStyle(live.elements, "countdownLabel");
  const calendarSaveOverride = elementOverrideStyle(live.elements, "calendarSaveText");
  const calendarGoogleOverride = elementOverrideStyle(live.elements, "calendarGoogleText");

  // live.eventDateIso/eventTime (gesetzt von DateQuickEdit.tsx ueber
  // DesignEditor.tsx, siehe LiveDesignState oben) haben Vorrang vor den
  // serverseitig berechneten Props — so aktualisieren sich Datumszeile UND
  // Countdown sofort, ohne dass der Vorschau-iframe neu laedt.
  const effectiveDate = live.eventDateIso ? new Date(live.eventDateIso) : eventDate;
  const effectiveTime = live.eventTime !== undefined ? live.eventTime : eventTime;
  const dateText = `${new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(effectiveDate)}${effectiveTime ? ` · ${effectiveTime} Uhr` : ""}`;

  // Kleine Render-Helfer statt dreifach kopierter editMode-Verzweigungen —
  // HeroCard rendert dieselben vier Textstellen in drei strukturell
  // unterschiedlichen Karten-Layouts (Bild-Karte/Umschlag-Reveal/einfache
  // Karte), aber die Klick-Auswahl-Logik dahinter ist ueberall identisch.
  function renderEventLabel(style: CSSProperties) {
    if (!editMode) return <div style={style}>{eventLabelText}</div>;
    return (
      <SelectableElement kind="text" label="Anlass-Label" selected={selectedKey === "eventLabel"} onSelect={() => selectElement("eventLabel")}>
        <InlineEditableText
          eventId={eventId}
          field="eventLabel"
          value={eventLabelRaw ?? ""}
          placeholder={`Standard: ${eventTypeDefaultLabel}`}
          onFocus={() => selectElement("eventLabel")}
          style={style}
        />
      </SelectableElement>
    );
  }

  function renderTitle(style: CSSProperties, as?: ElementType) {
    if (!editMode) {
      const Tag = as ?? "div";
      return <Tag style={style}>{title}</Tag>;
    }
    return (
      <SelectableElement kind="text" label="Titel" selected={selectedKey === "title"} onSelect={() => selectElement("title")}>
        <InlineEditableText eventId={eventId} field="title" value={title} as={as} onFocus={() => selectElement("title")} style={style} />
      </SelectableElement>
    );
  }

  function renderSubtitle(style: CSSProperties) {
    if (!editMode) return subtitle && <p style={style}>{subtitle}</p>;
    return (
      <SelectableElement kind="text" label="Untertitel" selected={selectedKey === "subtitle"} onSelect={() => selectElement("subtitle")}>
        <InlineEditableText
          eventId={eventId}
          field="subtitle"
          value={subtitle ?? ""}
          placeholder="Untertitel hinzufügen…"
          onFocus={() => selectElement("subtitle")}
          style={style}
        />
      </SelectableElement>
    );
  }

  function renderFamily(containerStyle: CSSProperties) {
    if (!hasFamilyNames) return null;
    const nameStyle: CSSProperties = { fontFamily: headingFont, ...familyOverride };
    return (
      <div className="customizer-card-families" style={containerStyle}>
        {editMode ? (
          <SelectableElement kind="text" label="Familiennamen" selected={selectedKey === "family"} onSelect={() => selectElement("family")}>
            <div style={{ display: "flex", alignItems: "center", gap: "inherit" }}>
              <div>
                <InlineEditableText eventId={eventId} field="familyLeft" value={familyLeft ?? ""} placeholder="—" onFocus={() => selectElement("family")} style={nameStyle} />
                <small>AİLESİ</small>
              </div>
              <div className="customizer-card-families-div" style={{ background: `${colors.accent}66` }} />
              <div>
                <InlineEditableText eventId={eventId} field="familyRight" value={familyRight ?? ""} placeholder="—" onFocus={() => selectElement("family")} style={nameStyle} />
                <small>AİLESİ</small>
              </div>
            </div>
          </SelectableElement>
        ) : (
          <>
            <div>
              <span style={nameStyle}>{familyLeft || "—"}</span>
              <small>AİLESİ</small>
            </div>
            <div className="customizer-card-families-div" style={{ background: `${colors.accent}66` }} />
            <div>
              <span style={nameStyle}>{familyRight || "—"}</span>
              <small>AİLESİ</small>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderDateLine(style: CSSProperties) {
    if (!editMode) return <div style={style}>{dateText}</div>;
    return (
      <SelectableElement kind="date" label="Datum & Uhrzeit" selected={selectedKey === "date"} onSelect={() => selectElement("date")}>
        <div style={style}>{dateText}</div>
      </SelectableElement>
    );
  }

  return (
    <div style={applyOrnamentFrame ? { position: "relative", padding: "22px 18px" } : undefined}>
      {applyOrnamentFrame && (
        <>
          <div style={{ position: "absolute", inset: 0, border: `1px solid ${colors.accent}` }} />
          <div style={{ position: "absolute", inset: 6, border: `1px solid ${colors.accent}66` }} />
          <CornerMotif color={colors.accent} corner="tl" />
          <CornerMotif color={colors.accent} corner="tr" />
          <CornerMotif color={colors.accent} corner="bl" />
          <CornerMotif color={colors.accent} corner="br" />
        </>
      )}
      {cardImageUrl ? (
        <div style={{ position: "relative", maxWidth: 380, margin: "0 auto" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- Kartengrafik mit variablem Seitenverhaeltnis je Design, kein fixes next/image-Format */}
          <img
            src={cardImageUrl}
            alt=""
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)" }}
          />
          <div
            style={{
              position: "absolute",
              inset: `${textZone.top}% ${textZone.right}% ${textZone.bottom}% ${textZone.left}%`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-evenly",
              textAlign: "center",
            }}
          >
            {renderEventLabel({ fontFamily: headingFont, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: colors.accent, ...eventLabelOverride })}
            <div>
              {renderTitle({
                fontFamily: headingFont,
                fontStyle: headingItalic ? "italic" : "normal",
                textTransform: headingUppercase ? "uppercase" : "none",
                fontWeight: 600,
                fontSize: "clamp(21px, 5.5vw, 30px)",
                color: colors.primary,
                ...titleOverride,
              })}
              {renderSubtitle({ fontSize: 12.5, opacity: 0.8, marginTop: 8, color: colors.primary, ...subtitleOverride })}
              {renderFamily({ color: colors.primary })}
            </div>
            {renderDateLine({ fontSize: 11, letterSpacing: "0.04em", color: colors.primary, opacity: 0.85, ...dateOverride })}
          </div>
        </div>
      ) : envelopeImages ? (
        <>
          {renderEventLabel({ fontFamily: headingFont, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.accent, marginBottom: 20, ...eventLabelOverride })}
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <EnvelopeReveal images={envelopeImages}>
              <div style={{ textAlign: "center" }}>
                {renderTitle({
                  fontFamily: headingFont,
                  fontStyle: headingItalic ? "italic" : "normal",
                  textTransform: headingUppercase ? "uppercase" : "none",
                  fontWeight: 600,
                  fontSize: "clamp(24px, 5vw, 34px)",
                  color: colors.primary,
                  ...titleOverride,
                })}
                {renderDateLine({ marginTop: 10, fontSize: 11.5, letterSpacing: "0.06em", color: colors.primary, opacity: 0.8, ...dateOverride })}
              </div>
            </EnvelopeReveal>
          </div>
          {renderSubtitle({ fontSize: 15, opacity: 0.75, marginTop: 24, ...subtitleOverride })}
          {renderFamily({ color: colors.primary, maxWidth: 320, margin: "12px auto 0" })}
        </>
      ) : (
        <>
          {renderEventLabel({ fontFamily: headingFont, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: colors.accent, marginBottom: 20, ...eventLabelOverride })}
          {renderTitle(
            {
              fontFamily: headingFont,
              fontStyle: headingItalic ? "italic" : "normal",
              textTransform: headingUppercase ? "uppercase" : "none",
              fontWeight: 600,
              fontSize: "clamp(34px, 6vw, 52px)",
              margin: 0,
              ...titleOverride,
            },
            "h1"
          )}
          {renderSubtitle({ fontSize: 15, opacity: 0.75, marginTop: 12, ...subtitleOverride })}
          {renderFamily({ color: colors.primary, maxWidth: 320, margin: "16px auto 0" })}
          <div style={{ width: 30, height: 1, background: colors.accent, margin: "24px auto" }} />
          {renderDateLine({ fontSize: 13, letterSpacing: "0.06em", opacity: 0.8, ...dateOverride })}
        </>
      )}

      {countdownOn && (
        <div style={{ marginTop: 32 }}>
          <Countdown
            key={effectiveDate.toISOString()}
            targetIso={effectiveDate.toISOString()}
            accent={colors.accent}
            editMode={editMode}
            eventId={eventId}
            daysLabel={countdownDaysLabel}
            hoursLabel={countdownHoursLabel}
            minutesLabel={countdownMinutesLabel}
            labelOverride={countdownLabelOverride}
            selected={selectedKey === "countdownLabel"}
            onSelect={() => selectElement("countdownLabel")}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
        {editMode ? (
          // <span> statt <a> im Editor-Modus: ein echter Link wuerde beim
          // Reinklicken zum Bearbeiten sofort navigieren/downloaden (siehe
          // gleiches Muster bei den Gaestebuch-/Musikwuensche-Buttons,
          // Schritt 3/4) — Gaeste sehen unten den echten, funktionsfaehigen Link.
          <SelectableElement
            kind="text"
            label='"In Kalender speichern"-Button'
            selected={selectedKey === "calendarSaveText"}
            onSelect={() => selectElement("calendarSaveText")}
          >
            <InlineEditableText
              eventId={eventId}
              field="calendarSaveText"
              value={calendarSaveText}
              as="span"
              onFocus={() => selectElement("calendarSaveText")}
              style={{ display: "inline-block", padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, ...calendarSaveOverride }}
            />
          </SelectableElement>
        ) : (
          <a
            href={`/e/${eventSlug}/ics`}
            style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none", ...calendarSaveOverride }}
          >
            {calendarSaveText}
          </a>
        )}
        {editMode ? (
          <SelectableElement
            kind="text"
            label='"Google Kalender"-Button'
            selected={selectedKey === "calendarGoogleText"}
            onSelect={() => selectElement("calendarGoogleText")}
          >
            <InlineEditableText
              eventId={eventId}
              field="calendarGoogleText"
              value={calendarGoogleText}
              as="span"
              onFocus={() => selectElement("calendarGoogleText")}
              style={{ display: "inline-block", padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, ...calendarGoogleOverride }}
            />
          </SelectableElement>
        ) : (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none", ...calendarGoogleOverride }}
          >
            {calendarGoogleText}
          </a>
        )}
      </div>
    </div>
  );
}
