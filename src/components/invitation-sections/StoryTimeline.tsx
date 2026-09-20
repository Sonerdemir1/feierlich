"use client";

import { EditableText, type TextField } from "./EditableText";
import type { IvColors } from "./types";

export type StoryMilestone = {
  id: string;
  dateDisplay: string;
  title: string;
  photoUrl?: string;
};

// Kennenlerngeschichte als Zickzack-Zeitleiste (Belle-Vorbild): zentrale
// Linie, abwechselnd linke/rechte Karten, runde Foto-Medaillons als
// Knotenpunkte. `text` ist EIN gemeinsamer Fliesstext (bestehendes
// loveStoryText-Feld) — die einzelnen Meilensteine (Titel/Datum/Foto) sind
// rein strukturell, noch nicht Teil des Textstil-Systems.
export function StoryTimeline({
  colors,
  fontFamily,
  fontStyle = "normal",
  text,
  milestones,
  editable = true,
}: {
  colors: IvColors;
  fontFamily: string;
  fontStyle?: "italic" | "normal";
  text: TextField;
  milestones: StoryMilestone[];
  editable?: boolean;
}) {
  return (
    <section className="iv-section" style={{ background: colors.background, ["--iv-accent" as string]: colors.accent }}>
      <div className="iv-inner">
        <div className="iv-head">
          <span className="iv-eyebrow">Wir lieben uns</span>
          <h2 className="iv-heading" style={{ fontFamily, fontStyle, color: colors.primary }}>
            Unsere Geschichte
          </h2>
          <EditableText field={text} editable={editable} as="p" label="Kennenlerngeschichte" placeholder="Erzählt eure Geschichte…" className="iv-intro" />
        </div>
        <div className="iv-story-track">
          {milestones.map((m, i) => {
            const side = i % 2 === 0 ? "left" : "right";
            return (
              <div className="iv-story-item" key={m.id}>
                <div className={`iv-story-card iv-story-card--${side}`}>
                  <div className="iv-story-date" style={{ color: colors.accent }}>
                    {m.dateDisplay}
                  </div>
                  <div style={{ fontFamily, fontStyle, fontSize: 17, color: colors.primary }}>{m.title}</div>
                </div>
                <div className="iv-story-photo" style={m.photoUrl ? { backgroundImage: `url(${m.photoUrl})` } : { background: colors.accent }} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
