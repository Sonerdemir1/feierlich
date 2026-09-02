// Kuratierte Schriftart-Auswahl fuer Einladungskarten — geteilt zwischen dem
// Marketing-Customizer (TemplateGallery.tsx, vor der Anmeldung) und dem
// echten Event-Editor im Dashboard, damit beide dieselben Optionen anbieten.
// Bewusst eine kleine, kuratierte Liste statt eines vollen Font-Pickers,
// damit jede Kombination gut aussieht. Alle CSS-Variablen sind global in
// src/app/layout.tsx geladen (next/font), funktionieren daher ueberall.
export type FontOption = { id: string; label: string; cssVar: string; italic?: boolean; uppercase?: boolean };

export const FONT_OPTIONS: FontOption[] = [
  { id: "cormorant", label: "Cormorant", cssVar: "var(--font-display)", italic: true },
  { id: "playfair", label: "Playfair", cssVar: "var(--font-playfair)" },
  { id: "cinzel", label: "Cinzel", cssVar: "var(--font-cinzel)", uppercase: true },
  { id: "script", label: "Skript", cssVar: "var(--font-script)" },
  { id: "worksans", label: "Work Sans", cssVar: "var(--font-body)" },
  { id: "poppins", label: "Poppins", cssVar: "var(--font-poppins)" },
];

export function fontOptionById(id: string | undefined | null): FontOption | null {
  return FONT_OPTIONS.find((f) => f.id === id) ?? null;
}
