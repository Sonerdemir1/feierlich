import { fontOptionById } from "./fonts";

// Pro-Element Textfeinsteuerung (Groesse + Farbe) fuer die vier
// frei formulierten Textstellen der echten Event-Seite — Titel
// (Namen), Untertitel, Datumszeile, Beschreibung. Kunden-Feedback:
// "alle einzelnen Sätze müssen anwählbar, verstellbar sein, Größe
// Farbe änderbar". Bewusst als kleine Preset-Stufen statt freiem
// px-Eingabefeld — einfacher zu bedienen, kein Risiko für kaputte
// Layouts durch extreme Werte.
export type TextElementKey = "title" | "subtitle" | "date" | "description" | "eventLabel" | "family";

// Reihenfolge, wie sie im Editor angezeigt wird (oben nach unten auf der
// Karte) — bewusst getrennt von der Key-Reihenfolge in den anderen
// Exports dieser Datei, die historisch gewachsen ist.
export const TEXT_ELEMENT_KEYS: TextElementKey[] = ["eventLabel", "title", "subtitle", "family", "date", "description"];

export type TextAlign = "left" | "center" | "right" | "justify";

export type TextElementStyle = {
  size?: string;
  color?: string;
  fontId?: string;
  align?: TextAlign;
  bold?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
};
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
  eventLabel: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 9 },
    { id: "lg", label: "Groß", px: 12 },
    { id: "xl", label: "Sehr groß", px: 14 },
  ],
  family: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
};

export const TEXT_ELEMENT_LABELS: Record<TextElementKey, string> = {
  title: "Titel (Namen)",
  subtitle: "Untertitel",
  date: "Datum & Uhrzeit",
  description: "Beschreibung",
  eventLabel: "Anlass-Label",
  family: "Familiennamen",
};

export function sizePresetPx(key: TextElementKey, id: string | undefined): number {
  if (!id) return 0;
  return ELEMENT_SIZE_PRESETS[key].find((p) => p.id === id)?.px ?? 0;
}

export type TextElementOverrideStyle = {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
  textAlign?: TextAlign;
  fontWeight?: number;
  fontStyle?: "italic" | "normal";
  textDecorationLine?: string;
};

// Liefert nur die Style-Properties, die tatsaechlich ueberschrieben werden
// sollen — leeres Objekt wenn kein Override gesetzt ist, damit bestehende
// clamp()/opacity-Werte und die globale Schriftart/Kursiv-Einstellung am
// Aufrufort unangetastet bleiben.
export function elementOverrideStyle(elements: StyleElements | undefined, key: TextElementKey): TextElementOverrideStyle {
  const el = elements?.[key];
  if (!el) return {};
  const out: TextElementOverrideStyle = {};
  const px = sizePresetPx(key, el.size);
  if (px > 0) out.fontSize = `${px}px`;
  if (el.color) out.color = el.color;
  if (el.fontId) {
    const font = fontOptionById(el.fontId);
    if (font) out.fontFamily = font.cssVar;
  }
  if (el.align) out.textAlign = el.align;
  if (el.bold) out.fontWeight = 700;
  if (el.italic) out.fontStyle = "italic";
  const decorations = [el.underline ? "underline" : "", el.strikethrough ? "line-through" : ""].filter(Boolean);
  if (decorations.length > 0) out.textDecorationLine = decorations.join(" ");
  return out;
}
