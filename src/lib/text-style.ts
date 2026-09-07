import { fontOptionById } from "./fonts";

// Erfundene Beispielwerte fuer Dresscode/Social-Media-Text im anonymen
// Customizer (DesignStudio.tsx defaultDraft()) — als benannte Konstanten
// statt Inline-Strings, damit apply-draft/route.ts denselben Wert zum
// Vergleich heranziehen kann (Bugfix: diese Platzhalter duerfen NICHT
// unveraendert auf einer echten, oeffentlichen Einladungsseite landen,
// siehe Kommentar dort).
export const DEFAULT_DRESSCODE_TEXT = "Elegant / Smart Casual";
export const DEFAULT_SOCIAL_MEDIA_TEXT = "#EureHochzeit2026";

// Pro-Element Textfeinsteuerung (Groesse + Farbe) fuer die vier
// frei formulierten Textstellen der echten Event-Seite — Titel
// (Namen), Untertitel, Datumszeile, Beschreibung. Kunden-Feedback:
// "alle einzelnen Sätze müssen anwählbar, verstellbar sein, Größe
// Farbe änderbar". Bewusst als kleine Preset-Stufen statt freiem
// px-Eingabefeld — einfacher zu bedienen, kein Risiko für kaputte
// Layouts durch extreme Werte.
export type TextElementKey =
  | "title"
  | "subtitle"
  | "date"
  | "description"
  | "eventLabel"
  | "family"
  | "location"
  | "agenda"
  | "guestbookHeading"
  | "guestbookHint"
  | "guestbookButtonText"
  | "guestbookSample"
  | "wishlistHeading"
  | "wishlistHint"
  | "musicHeading"
  | "musicHint"
  | "musicButtonText"
  | "musicSample"
  | "countdownLabel"
  | "calendarSaveText"
  | "calendarGoogleText"
  | "rsvpHeading"
  | "rsvpYesLabel"
  | "rsvpMaybeLabel"
  | "rsvpNoLabel"
  | "rsvpButtonText"
  | "seatingHeading"
  | "seatingHint"
  | "seatingButtonText"
  | "galleryHeading"
  | "galleryHint"
  | "galleryButtonText"
  | "dresscodeHeading"
  | "dresscodeText"
  | "socialMediaHeading"
  | "socialMediaText"
  | "menuHeading"
  | "menuHint"
  | "thankYouHeading"
  | "thankYouMessage"
  | "audioInvitationHeading"
  | "audioInvitationHint"
  | "videoMessageHeading"
  | "videoMessageHint";

// Reihenfolge, wie sie im Editor angezeigt wird (oben nach unten auf der
// Karte) — bewusst getrennt von der Key-Reihenfolge in den anderen
// Exports dieser Datei, die historisch gewachsen ist.
export const TEXT_ELEMENT_KEYS: TextElementKey[] = [
  "eventLabel",
  "title",
  "subtitle",
  "family",
  "date",
  "location",
  "description",
  "guestbookHeading",
  "guestbookHint",
  "guestbookButtonText",
  "guestbookSample",
  "wishlistHeading",
  "wishlistHint",
  "musicHeading",
  "musicHint",
  "musicButtonText",
  "musicSample",
  "countdownLabel",
  "calendarSaveText",
  "calendarGoogleText",
  "rsvpHeading",
  "rsvpYesLabel",
  "rsvpMaybeLabel",
  "rsvpNoLabel",
  "rsvpButtonText",
  "seatingHeading",
  "seatingHint",
  "seatingButtonText",
  "galleryHeading",
  "galleryHint",
  "galleryButtonText",
  "dresscodeHeading",
  "dresscodeText",
  "socialMediaHeading",
  "socialMediaText",
  "menuHeading",
  "menuHint",
  "thankYouHeading",
  "thankYouMessage",
  "audioInvitationHeading",
  "audioInvitationHint",
  "videoMessageHeading",
  "videoMessageHint",
];

// "agenda" bewusst NICHT in TEXT_ELEMENT_KEYS: dieses Array steuert das
// Speichern EINES globalen Stils pro Schluessel in Event.styleJson
// (DesignEditor.tsx pushLive()) — der Ablaufplan hat aber pro Eintrag einen
// EIGENEN Stil (siehe AgendaItem.style in DesignStudio.tsx/EditableAgenda.tsx),
// nicht einen einzigen globalen. "agenda" existiert nur als TextElementKey,
// damit TextControls.tsx/elementOverrideStyle() ihre Presets/Label
// wiederverwenden koennen, mit dem jeweiligen Eintrags-Stil als `style`-Prop.

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
// Laufzeit-Spiegel der TextElementStyle-Feldnamen — TypeScript-Typen
// existieren zur Laufzeit nicht, ungeprueftes Client-JSON (apply-draft/
// route.ts, agenda/route.ts) muss trotzdem gegen genau diese Liste
// pruefen koennen. Zentrale Stelle statt zweier unabhaengiger Kopien
// (gleiche Lehre wie TEXT_ELEMENT_KEYS aus Schritt 3) — beim Hinzufuegen
// eines Feldes zu TextElementStyle hier mitpflegen.
export const STYLE_FIELD_KEYS: (keyof TextElementStyle)[] = [
  "size",
  "color",
  "fontId",
  "align",
  "bold",
  "underline",
  "strikethrough",
  "italic",
];
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
  location: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 13 },
    { id: "xl", label: "Sehr groß", px: 15 },
  ],
  agenda: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 9 },
    { id: "lg", label: "Groß", px: 12 },
    { id: "xl", label: "Sehr groß", px: 14 },
  ],
  guestbookHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  guestbookHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  guestbookButtonText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  guestbookSample: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 9 },
    { id: "lg", label: "Groß", px: 12 },
    { id: "xl", label: "Sehr groß", px: 14 },
  ],
  wishlistHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  wishlistHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  musicHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  musicHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  musicButtonText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  musicSample: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 9 },
    { id: "lg", label: "Groß", px: 12 },
    { id: "xl", label: "Sehr groß", px: 14 },
  ],
  countdownLabel: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 8 },
    { id: "lg", label: "Groß", px: 11 },
    { id: "xl", label: "Sehr groß", px: 13 },
  ],
  calendarSaveText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 16 },
  ],
  calendarGoogleText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 16 },
  ],
  rsvpHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  rsvpYesLabel: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 16 },
  ],
  rsvpMaybeLabel: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 16 },
  ],
  rsvpNoLabel: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 10 },
    { id: "lg", label: "Groß", px: 14 },
    { id: "xl", label: "Sehr groß", px: 16 },
  ],
  rsvpButtonText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  seatingHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  seatingHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  seatingButtonText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  galleryHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  galleryHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  galleryButtonText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  dresscodeHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  dresscodeText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 12 },
    { id: "lg", label: "Groß", px: 16 },
    { id: "xl", label: "Sehr groß", px: 18 },
  ],
  socialMediaHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  socialMediaText: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 12 },
    { id: "lg", label: "Groß", px: 16 },
    { id: "xl", label: "Sehr groß", px: 18 },
  ],
  menuHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  menuHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  thankYouHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  thankYouMessage: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 12 },
    { id: "lg", label: "Groß", px: 16 },
    { id: "xl", label: "Sehr groß", px: 18 },
  ],
  audioInvitationHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  audioInvitationHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
    { id: "xl", label: "Sehr groß", px: 17 },
  ],
  videoMessageHeading: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 16 },
    { id: "lg", label: "Groß", px: 24 },
    { id: "xl", label: "Sehr groß", px: 28 },
  ],
  videoMessageHint: [
    { id: "md", label: "Standard", px: 0 },
    { id: "sm", label: "Klein", px: 11 },
    { id: "lg", label: "Groß", px: 15 },
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
  location: "Ort / Location",
  agenda: "Ablaufplan-Eintrag",
  guestbookHeading: "Gästebuch-Überschrift",
  guestbookHint: "Gästebuch-Hinweistext",
  guestbookButtonText: "Gästebuch-Button",
  guestbookSample: "Gästebuch-Beispielnachricht",
  wishlistHeading: "Wunschliste-Überschrift",
  wishlistHint: "Wunschliste-Hinweistext",
  musicHeading: "Musikwünsche-Überschrift",
  musicHint: "Musikwünsche-Hinweistext",
  musicButtonText: "Musikwünsche-Button",
  musicSample: "Musikwünsche-Beispiel",
  countdownLabel: "Countdown-Beschriftung",
  calendarSaveText: '"In Kalender speichern"-Button',
  calendarGoogleText: '"Google Kalender"-Button',
  rsvpHeading: "Zusagen-Überschrift",
  rsvpYesLabel: '"Wir kommen"-Beschriftung',
  rsvpMaybeLabel: '"Noch unsicher"-Beschriftung',
  rsvpNoLabel: '"Leider nicht"-Beschriftung',
  rsvpButtonText: "Zusagen-Button",
  seatingHeading: "Sitzplan-Überschrift",
  seatingHint: "Sitzplan-Hinweistext",
  seatingButtonText: "Sitzplan-Such-Button",
  galleryHeading: "Galerie-Überschrift",
  galleryHint: "Galerie-Hinweistext",
  galleryButtonText: "Galerie-Upload-Button",
  dresscodeHeading: "Dresscode-Überschrift",
  dresscodeText: "Dresscode-Text",
  socialMediaHeading: "Social-Media-Überschrift",
  socialMediaText: "Hashtag-Text",
  menuHeading: "Menükarte-Überschrift",
  menuHint: "Menükarte-Hinweistext",
  thankYouHeading: "Dankeskarte-Überschrift",
  thankYouMessage: "Dankestext",
  audioInvitationHeading: "Audio-Einladung-Überschrift",
  audioInvitationHint: "Audio-Einladung-Hinweistext",
  videoMessageHeading: "Video-Einladung-Überschrift",
  videoMessageHint: "Video-Einladung-Hinweistext",
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
