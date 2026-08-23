"use client";

import { useEffect, useState } from "react";

// Wechselt die Beispielkarte im Hero zwischen einem deutschen und einem
// tuerkischen Duegue-Beispiel — Hauptzielgruppe ist Werbung in tuerkischen
// Hochzeitssaelen, daher bewusst kein Kina-Beispiel hier (das steht schon
// als eigene Vorlage in der Liste), sondern die opulente Duegue-Palette
// (Altın Sedef: Bordeaux + Gold).
type HeroExample = {
  name: string;
  meta: string;
  bg: string;
  border: string;
  nameColor: string;
  ruleColor: string;
  metaColor: string;
  shadow: string;
};

const examples: HeroExample[] = [
  {
    name: "Anna & Lukas",
    meta: "14. JUNI 2026 · SCHLOSS EHRENFELS",
    bg: "#F3ECDF",
    border: "#E4D9C8",
    nameColor: "#8F4029",
    ruleColor: "#B9975B",
    metaColor: "#5C5248",
    shadow: "rgba(33, 28, 25, 0.35)",
  },
  {
    name: "Ayşe & Emre",
    meta: "DÜĞÜN · 20 HAZİRAN 2026 · İSTANBUL",
    bg: "#5C0F1F",
    border: "#E3B23C",
    nameColor: "#FAF6EF",
    ruleColor: "#E3B23C",
    metaColor: "#F0D9CC",
    shadow: "rgba(92, 15, 31, 0.45)",
  },
];

export function HeroRotator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % examples.length), 4200);
    return () => clearInterval(id);
  }, []);

  const ex = examples[index];

  return (
    <div
      className="hero-card"
      style={{
        background: ex.bg,
        borderColor: ex.border,
        boxShadow: `0 30px 60px -25px ${ex.shadow}`,
        transition: "background 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease",
      }}
    >
      <div key={index} className="hero-card-fade">
        <div className="name" style={{ color: ex.nameColor }}>
          {ex.name}
        </div>
        <div className="rule" style={{ background: ex.ruleColor }} />
        <div className="meta" style={{ color: ex.metaColor }}>
          {ex.meta}
        </div>
      </div>
    </div>
  );
}
