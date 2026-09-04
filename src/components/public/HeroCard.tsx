"use client";

import { useEffect, useState } from "react";
import { Countdown } from "@/components/public/Countdown";
import { EnvelopeReveal } from "@/components/marketing/EnvelopeReveal";
import { CornerMotif } from "@/components/marketing/TemplatePreview";
import { InlineEditableText } from "@/components/public/InlineEditableText";
import { fontOptionById } from "@/lib/fonts";
import { elementOverrideStyle, type StyleElements } from "@/lib/text-style";

type Colors = { primary: string; accent: string; background: string };
type TextZone = { top: number; right: number; bottom: number; left: number };

export type LiveDesignState = {
  colors: Colors;
  fontId?: string;
  ornaments: boolean;
  elements?: StyleElements;
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
  editMode,
  cardImageUrl,
  envelopeImages,
  textZone,
  hasFamilyNames,
  calendarUrl,
  countdownOn,
  templateFontFallback,
  initial,
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
  editMode: boolean;
  cardImageUrl: string | null;
  envelopeImages: string[] | null;
  textZone: TextZone;
  hasFamilyNames: boolean;
  calendarUrl: string;
  countdownOn: boolean;
  templateFontFallback: "var(--font-body)" | "var(--font-display)";
  initial: LiveDesignState;
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
  const headingUppercase = Boolean(chosenFont?.uppercase);
  const showOrnaments = live.ornaments;
  const applyOrnamentFrame = showOrnaments && !cardImageUrl;

  const titleOverride = elementOverrideStyle(live.elements, "title");
  const subtitleOverride = elementOverrideStyle(live.elements, "subtitle");
  const dateOverride = elementOverrideStyle(live.elements, "date");
  const eventLabelOverride = elementOverrideStyle(live.elements, "eventLabel");
  const familyOverride = elementOverrideStyle(live.elements, "family");

  const dateText = `${new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(eventDate)}${eventTime ? ` · ${eventTime} Uhr` : ""}`;

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
            <div
              style={{
                fontFamily: headingFont,
                fontSize: 10,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: colors.accent,
                ...eventLabelOverride,
              }}
            >
              {eventLabelText}
            </div>
            <div>
              {editMode ? (
                <InlineEditableText
                  eventId={eventId}
                  field="title"
                  value={title}
                  style={{
                    fontFamily: headingFont,
                    fontStyle: headingItalic ? "italic" : "normal",
                    textTransform: headingUppercase ? "uppercase" : "none",
                    fontWeight: 600,
                    fontSize: "clamp(21px, 5.5vw, 30px)",
                    color: colors.primary,
                    ...titleOverride,
                  }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: headingFont,
                    fontStyle: headingItalic ? "italic" : "normal",
                    textTransform: headingUppercase ? "uppercase" : "none",
                    fontWeight: 600,
                    fontSize: "clamp(21px, 5.5vw, 30px)",
                    color: colors.primary,
                    ...titleOverride,
                  }}
                >
                  {title}
                </div>
              )}
              {editMode ? (
                <InlineEditableText
                  eventId={eventId}
                  field="subtitle"
                  value={subtitle ?? ""}
                  placeholder="Untertitel hinzufügen…"
                  style={{ fontSize: 12.5, opacity: 0.8, marginTop: 8, color: colors.primary, ...subtitleOverride }}
                />
              ) : (
                subtitle && (
                  <p style={{ fontSize: 12.5, opacity: 0.8, marginTop: 8, color: colors.primary, ...subtitleOverride }}>{subtitle}</p>
                )
              )}
              {hasFamilyNames && (
                <div className="customizer-card-families" style={{ color: colors.primary }}>
                  <div>
                    <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyLeft || "—"}</span>
                    <small>AİLESİ</small>
                  </div>
                  <div className="customizer-card-families-div" style={{ background: `${colors.accent}66` }} />
                  <div>
                    <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyRight || "—"}</span>
                    <small>AİLESİ</small>
                  </div>
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.04em", color: colors.primary, opacity: 0.85, ...dateOverride }}>{dateText}</div>
          </div>
        </div>
      ) : envelopeImages ? (
        <>
          <div
            style={{
              fontFamily: headingFont,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.accent,
              marginBottom: 20,
              ...eventLabelOverride,
            }}
          >
            {eventLabelText}
          </div>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <EnvelopeReveal images={envelopeImages}>
              <div style={{ textAlign: "center" }}>
                {editMode ? (
                  <InlineEditableText
                    eventId={eventId}
                    field="title"
                    value={title}
                    style={{
                      fontFamily: headingFont,
                      fontStyle: headingItalic ? "italic" : "normal",
                      textTransform: headingUppercase ? "uppercase" : "none",
                      fontWeight: 600,
                      fontSize: "clamp(24px, 5vw, 34px)",
                      color: colors.primary,
                      ...titleOverride,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontFamily: headingFont,
                      fontStyle: headingItalic ? "italic" : "normal",
                      textTransform: headingUppercase ? "uppercase" : "none",
                      fontWeight: 600,
                      fontSize: "clamp(24px, 5vw, 34px)",
                      color: colors.primary,
                      ...titleOverride,
                    }}
                  >
                    {title}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11.5, letterSpacing: "0.06em", color: colors.primary, opacity: 0.8, ...dateOverride }}>
                  {dateText}
                </div>
              </div>
            </EnvelopeReveal>
          </div>
          {editMode ? (
            <InlineEditableText
              eventId={eventId}
              field="subtitle"
              value={subtitle ?? ""}
              placeholder="Untertitel hinzufügen…"
              style={{ fontSize: 15, opacity: 0.75, marginTop: 24, ...subtitleOverride }}
            />
          ) : (
            subtitle && <p style={{ fontSize: 15, opacity: 0.75, marginTop: 24, ...subtitleOverride }}>{subtitle}</p>
          )}
          {hasFamilyNames && (
            <div className="customizer-card-families" style={{ color: colors.primary, maxWidth: 320, margin: "12px auto 0" }}>
              <div>
                <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyLeft || "—"}</span>
                <small>AİLESİ</small>
              </div>
              <div className="customizer-card-families-div" style={{ background: `${colors.accent}66` }} />
              <div>
                <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyRight || "—"}</span>
                <small>AİLESİ</small>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              fontFamily: headingFont,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.accent,
              marginBottom: 20,
              ...eventLabelOverride,
            }}
          >
            {eventLabelText}
          </div>
          {editMode ? (
            <InlineEditableText
              eventId={eventId}
              field="title"
              value={title}
              as="h1"
              style={{
                fontFamily: headingFont,
                fontStyle: headingItalic ? "italic" : "normal",
                textTransform: headingUppercase ? "uppercase" : "none",
                fontWeight: 600,
                fontSize: "clamp(34px, 6vw, 52px)",
                margin: 0,
                ...titleOverride,
              }}
            />
          ) : (
            <h1
              style={{
                fontFamily: headingFont,
                fontStyle: headingItalic ? "italic" : "normal",
                textTransform: headingUppercase ? "uppercase" : "none",
                fontWeight: 600,
                fontSize: "clamp(34px, 6vw, 52px)",
                margin: 0,
                ...titleOverride,
              }}
            >
              {title}
            </h1>
          )}
          {editMode ? (
            <InlineEditableText
              eventId={eventId}
              field="subtitle"
              value={subtitle ?? ""}
              placeholder="Untertitel hinzufügen…"
              style={{ fontSize: 15, opacity: 0.75, marginTop: 12, ...subtitleOverride }}
            />
          ) : (
            subtitle && <p style={{ fontSize: 15, opacity: 0.75, marginTop: 12, ...subtitleOverride }}>{subtitle}</p>
          )}
          {hasFamilyNames && (
            <div className="customizer-card-families" style={{ color: colors.primary, maxWidth: 320, margin: "16px auto 0" }}>
              <div>
                <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyLeft || "—"}</span>
                <small>AİLESİ</small>
              </div>
              <div className="customizer-card-families-div" style={{ background: `${colors.accent}66` }} />
              <div>
                <span style={{ fontFamily: headingFont, ...familyOverride }}>{familyRight || "—"}</span>
                <small>AİLESİ</small>
              </div>
            </div>
          )}
          <div style={{ width: 30, height: 1, background: colors.accent, margin: "24px auto" }} />
          <div style={{ fontSize: 13, letterSpacing: "0.06em", opacity: 0.8, ...dateOverride }}>{dateText}</div>
        </>
      )}

      {countdownOn && (
        <div style={{ marginTop: 32 }}>
          <Countdown targetIso={eventDate.toISOString()} accent={colors.accent} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
        <a
          href={`/e/${eventSlug}/ics`}
          style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none" }}
        >
          In Kalender speichern
        </a>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "9px 16px", fontSize: 12, border: `1px solid ${colors.accent}88`, color: colors.primary, textDecoration: "none" }}
        >
          Google Kalender
        </a>
      </div>
    </div>
  );
}
