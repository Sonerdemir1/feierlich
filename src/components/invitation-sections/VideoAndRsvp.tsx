"use client";

import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

// Video-Einladung + Zusagen nebeneinander (Belle-Vorbild). Beide Funktionen
// sind unabhaengig voneinander zuschaltbar (showRsvp/videoInvitation) —
// steht nur eine davon, nimmt sie die volle Breite ein (siehe
// gridColumn-Logik unten).
export function VideoAndRsvp({
  colors,
  showRsvp,
  showVideo,
  rsvpHeading,
  yesLabel,
  maybeLabel,
  noLabel,
  submitButtonText,
  videoHeading,
  videoHint,
  videoThumbnailUrl,
  editable = true,
}: {
  colors: IvColors;
  showRsvp: boolean;
  showVideo: boolean;
  rsvpHeading: TextField;
  yesLabel: TextField;
  maybeLabel: TextField;
  noLabel: TextField;
  submitButtonText?: TextField;
  videoHeading?: TextField;
  videoHint?: TextField;
  videoThumbnailUrl?: string;
  editable?: boolean;
}) {
  if (!showRsvp && !showVideo) return null;

  return (
    <section className="iv-section" style={{ background: colors.background }}>
      <div className="iv-inner">
        <div className="iv-video-rsvp" style={!showRsvp || !showVideo ? { gridTemplateColumns: "1fr" } : undefined}>
          {showRsvp && (
            <div className="iv-rsvp-box">
              <EditableText
                field={rsvpHeading}
                editable={editable}
                as="h3"
                label="Zusagen-Überschrift"
                placeholder="Kommt ihr?"
                style={{ margin: "0 0 14px", color: colors.primary, textAlign: "center" }}
              />
              <div className="iv-rsvp-options" style={{ ["--iv-accent" as string]: colors.accent }}>
                <EditableText
                  field={yesLabel}
                  editable={editable}
                  as="span"
                  label="Zusagen-Beschriftung"
                  placeholder="Zusagen"
                  className="iv-rsvp-option iv-rsvp-option--primary"
                />
                <EditableText field={maybeLabel} editable={editable} as="span" label="Unsicher-Beschriftung" placeholder="Unsicher" className="iv-rsvp-option" />
                <EditableText field={noLabel} editable={editable} as="span" label="Absagen-Beschriftung" placeholder="Absagen" className="iv-rsvp-option" />
              </div>
              <div className="iv-rsvp-fields">
                <input type="text" placeholder="Euer Name" disabled />
                <input type="email" placeholder="E-Mail" disabled />
              </div>
              {submitButtonText && (
                <EditableText
                  field={submitButtonText}
                  editable={editable}
                  as="span"
                  label="Zusagen-Button"
                  placeholder="Zusage senden"
                  style={{
                    display: "block",
                    marginTop: 12,
                    padding: "11px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                    background: colors.accent,
                    color: "#fff",
                    borderRadius: 4,
                  }}
                />
              )}
            </div>
          )}
          {showVideo && (
            <div>
              {videoHeading && (
                <EditableText field={videoHeading} editable={editable} as="h3" label="Video-Einladung-Überschrift" placeholder="Unsere Videobotschaft" style={{ margin: "0 0 8px", color: colors.primary }} />
              )}
              {videoHint && (
                <EditableText field={videoHint} editable={editable} as="p" label="Video-Einladung-Hinweistext" placeholder="" style={{ margin: "0 0 14px" }} className="iv-intro" />
              )}
              <div
                className="iv-video-box"
                style={
                  videoThumbnailUrl
                    ? { backgroundImage: `url(${videoThumbnailUrl})` }
                    : { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)` }
                }
              >
                <div className="iv-video-play" aria-hidden="true">
                  ▶
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
