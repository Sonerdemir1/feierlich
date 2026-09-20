"use client";

import { useEffect, useState } from "react";
import { Hero } from "@/components/invitation-sections/Hero";
import { BigDayCountdown } from "@/components/invitation-sections/BigDayCountdown";
import { CameraSection } from "@/components/invitation-sections/CameraSection";
import { SelectableElement } from "@/components/editor/SelectableElement";
import { ElementToolbar } from "@/components/editor/ElementToolbar";
import { InlineEditableField } from "@/components/public/InlineEditableField";
import { useLiveField } from "@/components/public/useLiveField";
import { fontOptionById } from "@/lib/fonts";
import type { LiveDesignState } from "@/lib/live-design-state";
import { EnvelopeReveal } from "@/components/marketing/EnvelopeReveal";

// Ersetzt HeroCard.tsx fuer alle Vorlagen OHNE echte Kartengrafik (Plan-
// Phase D) — nutzt dieselben Hero.tsx/BigDayCountdown.tsx-Komponenten wie
// die Gestalten-Vorschau (DesignStudio.tsx), damit beide Ansichten
// strukturell identisch sind (CLAUDE.md Regel 6). Live-Bearbeitung
// (postMessage + Speichern) laeuft ueber useLiveField.ts statt ueber
// lokalen Draft-State — gleiche TextField-Form, unterschiedliche Quelle.
//
// EIN Sonderfall bleibt bewusst unveraendert/bounded: envelopeImages (echte
// fotografierte Umschlag-Bildsequenz, nur EIN Template nutzt das aktuell,
// siehe EnvelopeReveal.tsx) — dessen fester Seitenverhaeltnis-Bildsatz
// vertraegt keinen randlosen Vollbild-Hero, bleibt deshalb in einer
// begrenzten Breite wie bisher, statt die echten Fotos zu verzerren.
export function EventHero({
  eventId,
  eventSlug,
  title,
  familyLeft,
  familyRight,
  eventDate,
  eventTime,
  eventLabelText,
  eventLabelRaw,
  editMode,
  envelopeImages,
  hasFamilyNames,
  eventLocationText,
  countdownOn,
  templateFontFallback,
  initial,
  countdownDaysLabel,
  countdownHoursLabel,
  countdownMinutesLabel,
  calendarSaveText,
  calendarGoogleText,
  calendarUrl,
  descriptionText,
  photoUrl,
}: {
  eventId: string;
  eventSlug: string;
  title: string;
  familyLeft: string | null;
  familyRight: string | null;
  eventDate: Date;
  eventTime: string | null;
  eventLabelText: string;
  eventLabelRaw: string | null;
  editMode: boolean;
  envelopeImages: string[] | null;
  hasFamilyNames: boolean;
  eventLocationText: string | undefined;
  countdownOn: boolean;
  templateFontFallback: "var(--font-body)" | "var(--font-display)";
  initial: LiveDesignState;
  countdownDaysLabel: string;
  countdownHoursLabel: string;
  countdownMinutesLabel: string;
  calendarSaveText: string;
  calendarGoogleText: string;
  calendarUrl: string;
  // "Der große Tag"-Introtext teilt sich bewusst dasselbe Feld wie die
  // bisherige separate Beschreibung (event.description) — kein neues
  // Prisma-Feld dafuer (bleibt bei der bereits getroffenen Entscheidung,
  // fuer Phase D keine Schema-Aenderung vorzunehmen). e/[slug]/page.tsx
  // blendet die bisherige eigenstaendige Beschreibungs-Sektion deshalb aus,
  // sobald der Countdown (und damit dieses Band) aktiv ist — sonst
  // erschiene derselbe Text zweimal.
  descriptionText: string;
  photoUrl?: string;
}) {
  const [live, setLive] = useState<LiveDesignState>(initial);

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

  const colors = live.colors;
  const chosenFont = fontOptionById(live.fontId);
  const headingFont = chosenFont?.cssVar ?? templateFontFallback;
  const headingItalic = chosenFont ? Boolean(chosenFont.italic) : headingFont === "var(--font-display)";

  const effectiveDate = live.eventDateIso ? new Date(live.eventDateIso) : eventDate;
  const effectiveTime = live.eventTime !== undefined ? live.eventTime : eventTime;
  const dateText = `${new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(effectiveDate)}${effectiveTime ? ` · ${effectiveTime} Uhr` : ""}`;

  const titleField = useLiveField(eventId, "title", title);
  const eventLabelField = useLiveField(eventId, "eventLabel", eventLabelRaw ?? "");
  const familyLeftField = useLiveField(eventId, "family", familyLeft ?? "", { saveField: "familyLeft" });
  const familyRightField = useLiveField(eventId, "family", familyRight ?? "", { saveField: "familyRight" });
  const calendarSaveField = useLiveField(eventId, "calendarSaveText", calendarSaveText);
  const calendarGoogleField = useLiveField(eventId, "calendarGoogleText", calendarGoogleText);
  const bigDayIntroField = useLiveField(eventId, "description", descriptionText);
  const daysLabelField = useLiveField(eventId, "countdownLabel", countdownDaysLabel, { saveField: "countdownDaysLabel" });
  const hoursLabelField = useLiveField(eventId, "countdownLabel", countdownHoursLabel, { saveField: "countdownHoursLabel" });
  const minutesLabelField = useLiveField(eventId, "countdownLabel", countdownMinutesLabel, { saveField: "countdownMinutesLabel" });

  const colorsProp = { primary: colors.primary, accent: colors.accent, background: colors.background };

  const heroEl = (
    <Hero
      photoUrl={photoUrl}
      colors={colorsProp}
      fontFamily={headingFont}
      fontStyle={headingItalic ? "italic" : "normal"}
      editable={editMode}
      eventLabel={eventLabelField.field}
      eventLabelPlaceholder={eventLabelText}
      eventLabelToolbar={
        editMode && eventLabelField.field.selected ? (
          <ElementToolbar elementKey="eventLabel" style={eventLabelField.rawStyle} defaultColor="#fff" onChange={eventLabelField.onStyleChange} />
        ) : undefined
      }
      title={titleField.field}
      titleToolbar={
        editMode && titleField.field.selected ? <ElementToolbar elementKey="title" style={titleField.rawStyle} defaultColor="#fff" onChange={titleField.onStyleChange} /> : undefined
      }
      location={{ display: eventLocationText ?? "", selected: false, onSelect: () => {} }}
      date={{ display: dateText, selected: false, onSelect: () => {} }}
    />
  );

  return (
    <>
      {envelopeImages ? (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <EnvelopeReveal images={envelopeImages}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontFamily: headingFont, fontStyle: headingItalic ? "italic" : "normal", fontSize: "clamp(28px, 6vw, 40px)" }}>{title}</div>
              <div style={{ marginTop: 10, fontSize: 12, letterSpacing: "0.05em", opacity: 0.85 }}>{dateText}</div>
            </div>
          </EnvelopeReveal>
        </div>
      ) : (
        heroEl
      )}

      <div className="iv-section iv-section--tight" style={{ background: colors.background }}>
        <div className="iv-inner" style={{ maxWidth: 420, textAlign: "center" }}>
          {hasFamilyNames && (
            <div className="customizer-card-families" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
              <div>
                {editMode ? (
                  <SelectableElement
                    kind="text"
                    label="Familiennamen"
                    selected={familyLeftField.field.selected}
                    onSelect={familyLeftField.field.onSelect}
                    toolbar={
                      familyLeftField.field.selected ? (
                        <ElementToolbar elementKey="family" style={familyLeftField.rawStyle} defaultColor={colors.primary} onChange={familyLeftField.onStyleChange} />
                      ) : undefined
                    }
                  >
                    <InlineEditableField
                      value={familyLeftField.field.value}
                      onChange={familyLeftField.field.onChange}
                      onFocus={familyLeftField.field.onSelect}
                      placeholder="—"
                      style={{ fontFamily: headingFont }}
                    />
                  </SelectableElement>
                ) : (
                  <span style={{ fontFamily: headingFont }}>{familyLeft || "—"}</span>
                )}
                <small style={{ display: "block" }}>AİLESİ</small>
              </div>
              <div className="customizer-card-families-div" style={{ background: `${colors.accent}66`, margin: "0 14px" }} />
              <div>
                {editMode ? (
                  <SelectableElement kind="text" label="Familiennamen" selected={familyRightField.field.selected} onSelect={familyRightField.field.onSelect}>
                    <InlineEditableField
                      value={familyRightField.field.value}
                      onChange={familyRightField.field.onChange}
                      onFocus={familyRightField.field.onSelect}
                      placeholder="—"
                      style={{ fontFamily: headingFont }}
                    />
                  </SelectableElement>
                ) : (
                  <span style={{ fontFamily: headingFont }}>{familyRight || "—"}</span>
                )}
                <small style={{ display: "block" }}>AİLESİ</small>
              </div>
            </div>
          )}

          <div className="customizer-card-actions" style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: hasFamilyNames ? 24 : 0 }}>
            {editMode ? (
              <SelectableElement
                kind="text"
                label='"In Kalender speichern"-Button'
                selected={calendarSaveField.field.selected}
                onSelect={calendarSaveField.field.onSelect}
                toolbar={
                  calendarSaveField.field.selected ? (
                    <ElementToolbar elementKey="calendarSaveText" style={calendarSaveField.rawStyle} defaultColor={colors.primary} onChange={calendarSaveField.onStyleChange} />
                  ) : undefined
                }
              >
                <InlineEditableField
                  value={calendarSaveField.field.value}
                  onChange={calendarSaveField.field.onChange}
                  onFocus={calendarSaveField.field.onSelect}
                  as="span"
                  style={{ display: "inline-block", padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary }}
                />
              </SelectableElement>
            ) : (
              <a href={`/e/${eventSlug}/ics`} style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none" }}>
                {calendarSaveText}
              </a>
            )}
            {editMode ? (
              <SelectableElement kind="text" label='"Google Kalender"-Button' selected={calendarGoogleField.field.selected} onSelect={calendarGoogleField.field.onSelect}>
                <InlineEditableField
                  value={calendarGoogleField.field.value}
                  onChange={calendarGoogleField.field.onChange}
                  onFocus={calendarGoogleField.field.onSelect}
                  as="span"
                  style={{ display: "inline-block", padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary }}
                />
              </SelectableElement>
            ) : (
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none" }}>
                {calendarGoogleText}
              </a>
            )}
          </div>
        </div>
      </div>

      {countdownOn && !envelopeImages && (
        <CameraSection>
          <BigDayCountdown
            photoUrl={photoUrl}
            colors={colorsProp}
            fontFamily={headingFont}
            fontStyle={headingItalic ? "italic" : "normal"}
            dateDisplay={dateText}
            targetIso={effectiveDate.toISOString()}
            editable={editMode}
            intro={bigDayIntroField.field}
            daysLabel={daysLabelField.field}
            hoursLabel={hoursLabelField.field}
            minutesLabel={minutesLabelField.field}
          />
        </CameraSection>
      )}
    </>
  );
}
