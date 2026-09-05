// Kuratierte Schriftart-Auswahl fuer Einladungskarten — geteilt zwischen dem
// Marketing-Customizer (TemplateGallery.tsx, vor der Anmeldung) und dem
// echten Event-Editor im Dashboard, damit beide dieselben Optionen anbieten.
// Alle CSS-Variablen sind global in src/app/layout.tsx geladen (next/font),
// funktionieren daher ueberall. googleFamily ist der echte Google-Fonts-
// Familienname derselben Schrift — wird dort gebraucht, wo next/og (Satori,
// siehe social-graphic/route.tsx) die Schriftdatei zur Laufzeit selbst laedt
// statt CSS-Variablen zu nutzen.
export type FontCategory = "modern" | "klassisch" | "schreibmaschine" | "handschrift" | "auffaellig";

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  modern: "Modern",
  klassisch: "Klassisch",
  schreibmaschine: "Schreibmaschine",
  handschrift: "Handschrift",
  auffaellig: "Auffällig",
};

export type FontOption = {
  id: string;
  label: string;
  cssVar: string;
  googleFamily: string;
  category: FontCategory;
  italic?: boolean;
  uppercase?: boolean;
};

export const FONT_OPTIONS: FontOption[] = [
  { id: "cormorant", label: "Cormorant", cssVar: "var(--font-cormorant)", googleFamily: "Cormorant Garamond", category: "klassisch", italic: true },
  { id: "playfair", label: "Playfair", cssVar: "var(--font-playfair)", googleFamily: "Playfair Display", category: "klassisch" },
  { id: "garamond", label: "EB Garamond", cssVar: "var(--font-garamond)", googleFamily: "EB Garamond", category: "klassisch" },
  { id: "cinzel", label: "Cinzel", cssVar: "var(--font-cinzel)", googleFamily: "Cinzel", category: "auffaellig", uppercase: true },
  { id: "abril", label: "Abril Fatface", cssVar: "var(--font-abril)", googleFamily: "Abril Fatface", category: "auffaellig" },
  { id: "script", label: "Skript", cssVar: "var(--font-script)", googleFamily: "Great Vibes", category: "handschrift", italic: true },
  { id: "dancing", label: "Dancing Script", cssVar: "var(--font-dancing)", googleFamily: "Dancing Script", category: "handschrift", italic: true },
  { id: "sacramento", label: "Sacramento", cssVar: "var(--font-sacramento)", googleFamily: "Sacramento", category: "handschrift", italic: true },
  { id: "special-elite", label: "Special Elite", cssVar: "var(--font-special-elite)", googleFamily: "Special Elite", category: "schreibmaschine" },
  { id: "courier-prime", label: "Courier Prime", cssVar: "var(--font-courier-prime)", googleFamily: "Courier Prime", category: "schreibmaschine" },
  { id: "worksans", label: "Work Sans", cssVar: "var(--font-worksans)", googleFamily: "Work Sans", category: "modern" },
  { id: "poppins", label: "Poppins", cssVar: "var(--font-poppins)", googleFamily: "Poppins", category: "modern" },
  { id: "manrope", label: "Manrope", cssVar: "var(--font-manrope)", googleFamily: "Manrope", category: "modern" },
];

export function fontOptionById(id: string | undefined | null): FontOption | null {
  return FONT_OPTIONS.find((f) => f.id === id) ?? null;
}

export function fontOptionsByCategory(category: FontCategory): FontOption[] {
  return FONT_OPTIONS.filter((f) => f.category === category);
}
