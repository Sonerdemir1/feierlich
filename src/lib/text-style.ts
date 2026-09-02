// Pro-Element Textfeinsteuerung (Groesse + Farbe) fuer die vier
// frei formulierten Textstellen der echten Event-Seite — Titel
// (Namen), Untertitel, Datumszeile, Beschreibung. Kunden-Feedback:
// "alle einzelnen Sätze müssen anwählbar, verstellbar sein, Größe
// Farbe änderbar". Bewusst als kleine Preset-Stufen statt freiem
// px-Eingabefeld — einfacher zu bedienen, kein Risiko für kaputte
// Layouts durch extreme Werte.
export type TextElementKey = "title" | "subtitle" | "date" | "description";

export type TextElementStyle = { size?: string; color?: string };
export type StyleElements = Partial<Record<TextElementKey, TextElementStyle>>;

export type SizePreset = { id: string; label: string; px: number };

// px: 0 bedeutet "Standard" (kein Override, Vorlagen-Basisgröße bleibt aktiv).
export const ELEMENT_SIZE_PRESETS: Record<TextElementKey, SizePreset[]> = {
  title: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 24 },
    { id: "lg", label: "Groß", px: 40 },
    { id: "xl", label: "Sehr groß", px: 52 },
  ],
  subtitle: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 18 },
  ],
  date: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 13 },
    { id: "xl", label: "Sehr groß", px: 15 },
  ],
  description: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 13 },
    { id: "lg", label: "Groß", px: 16 },
    { id: "xl", label: "Sehr groß", px: 18 },
  ],
};

export const TEXT_ELEMENT_LABELS: Record<TextElementKey, string> = {
  title: "Titel (Namen)",
  subtitle: "Untertitel",
  date: "Datum & Uhrzeit",
  description: "Beschreibung",
};

export function sizePresetPx(key: TextElementKey, id: string | undefined): number {
  if (!id) return 0;
  return ELEMENT_SIZE_PRESETS[key].find((p) => p.id === id)?.px ?? 0;
}

// Liefert nur die Style-Properties, die tatsaechlich ueberschrieben werden
// sollen — leeres Objekt wenn kein Override gesetzt ist, damit bestehende
// clamp()/opacity-Werte am Aufrufort unangetastet bleiben.
export function elementOverrideStyle(elements: StyleElements | undefined, key: TextElementKey): { fontSize?: string; color?: string } {
  const el = elements?.[key];
  if (!el) return {};
  const out: { fontSize?: string; color?: string } = {};
  const px = sizePresetPx(key, el.size);
  if (px > 0) out.fontSize = `${px}px`;
  if (el.color) out.color = el.color;
  return out;
}
