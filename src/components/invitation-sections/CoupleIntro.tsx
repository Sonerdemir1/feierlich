"use client";

import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

// Paar-Vorstellung ("Hello!"), Belle-Vorbild: zwei runde Portraits + Herz
// mittig, links/rechts flankierender Bio-Text je Partner.
export function CoupleIntro({
  colors,
  fontFamily,
  fontStyle = "normal",
  leftName,
  leftPhotoUrl,
  leftBio,
  rightName,
  rightPhotoUrl,
  rightBio,
  editable = true,
}: {
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  leftName: TextField;
  leftPhotoUrl?: string;
  leftBio: TextField;
  rightName: TextField;
  rightPhotoUrl?: string;
  rightBio: TextField;
  editable?: boolean;
}) {
  return (
    <section className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
      <div className="iv-inner">
        <div className="iv-head">
          <span className="iv-eyebrow">Hallo!</span>
          <h2 className="iv-heading" style={{ fontFamily, fontStyle, color: colors.primary }}>
            Wir laden euch ein, mit uns zu feiern
          </h2>
        </div>
        <div className="iv-couple-row">
          <div className="iv-couple-person">
            <div
              className="iv-couple-photo"
              style={
                leftPhotoUrl
                  ? { backgroundImage: `url(${leftPhotoUrl})` }
                  : { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)` }
              }
            />
            <div className="iv-couple-bio">
              <EditableText
                field={leftName}
                editable={editable}
                as="div"
                label="Name (links)"
                placeholder="Anna"
                style={{ fontFamily, fontStyle, fontSize: 18, color: colors.primary, marginBottom: 6 }}
              />
              <EditableText field={leftBio} editable={editable} as="p" label="Kurzvorstellung (links)" placeholder="Ein paar Worte über sie…" />
            </div>
          </div>
          <span className="iv-couple-heart" aria-hidden="true">
            ♥
          </span>
          <div className="iv-couple-person">
            <div
              className="iv-couple-photo"
              style={
                rightPhotoUrl
                  ? { backgroundImage: `url(${rightPhotoUrl})` }
                  : { background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${colors.accent} 55%, #fff) 0%, ${colors.accent} 100%)` }
              }
            />
            <div className="iv-couple-bio">
              <EditableText
                field={rightName}
                editable={editable}
                as="div"
                label="Name (rechts)"
                placeholder="Lukas"
                style={{ fontFamily, fontStyle, fontSize: 18, color: colors.primary, marginBottom: 6 }}
              />
              <EditableText field={rightBio} editable={editable} as="p" label="Kurzvorstellung (rechts)" placeholder="Ein paar Worte über ihn…" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
