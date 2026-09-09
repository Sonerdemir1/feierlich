import type { CSSProperties } from "react";

// Geteilt zwischen DesignStudio.tsx (anonymer Entwurf) und HeroCard.tsx
// (echtes Event) — beide zeigen dieselbe Foto-Form-Auswahl, siehe
// apply-draft/route.ts fuer die Uebertragung beim Signup. DesignStudio.tsx
// behaelt bewusst seine eigene, bereits bestehende Kopie (geringeres
// Risiko als ein Umbau eines bereits funktionierenden Datei) — nur die
// NEUE Verwendung in HeroCard.tsx nutzt dieses gemeinsame Modul.
export type PhotoShape = "rect" | "circle" | "star" | "polaroid";

export const STAR_CLIP = "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";

export function photoStyle(shape: PhotoShape): CSSProperties {
  switch (shape) {
    case "circle":
      return { width: "52%", aspectRatio: "1", borderRadius: "50%", objectFit: "cover" };
    case "star":
      return { width: "58%", aspectRatio: "1", objectFit: "cover", clipPath: STAR_CLIP };
    case "polaroid":
      return {
        width: "68%",
        aspectRatio: "4 / 3",
        objectFit: "cover",
        border: "8px solid #FAF6EF",
        borderBottom: "22px solid #FAF6EF",
        boxShadow: "0 10px 20px rgba(0,0,0,0.28)",
        transform: "rotate(-2deg)",
      };
    default:
      return { width: "80%", aspectRatio: "4 / 3", objectFit: "cover" };
  }
}
