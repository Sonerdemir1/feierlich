import { TEXT_ELEMENT_KEYS } from "./text-style";

// Baut colorOverride/styleJson aus dem Design-Formular (Farben, Schriftart,
// Verzierungen, Pro-Element-Feinsteuerung) — geteilt zwischen der
// server-action-Variante (saveDesign, src/app/dashboard/events/actions.ts,
// non-JS-Fallback + Vorlagenwechsel-Reset) und der Live-Sync-Route
// (src/app/dashboard/events/[id]/design/route.ts, kein Redirect/Remount).
// Reine Datenfunktion, kein "use server" hier — sonst wuerde Next.js sie
// selbst als Server Action behandeln.
// `existingStyleJson` (Event.styleJson VOR diesem Speichervorgang) —
// gefundener Bug: diese Funktion baute styleJson bisher komplett neu auf
// (nur aus den Feldern, die DIESES Formular kennt: fontId/ornaments/
// elements). Felder, die nur beim Signup aus dem Gestalten-Entwurf gesetzt
// werden (photoShape/showFloral/showPhotoBackground) und jetzt auch die
// neue Abschnitts-Reihenfolge (sectionOrder, Inline-Umsortieren) gingen
// dadurch beim naechsten Design-Speichern (Farbe/Schrift/Textstil aendern)
// STILLSCHWEIGEND verloren, weil sie nicht ins neu gebaute Objekt
// uebernommen wurden. Jetzt: alles aus dem bestehenden JSON uebernehmen,
// das dieses Formular nicht selbst setzt.
export function buildDesignUpdate(formData: FormData, existingStyleJson?: string | null): { colorOverride: string; styleJson: string } {
  const override: Record<string, string> = {};
  for (const key of ["primary", "accent", "background"] as const) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) override[key] = value;
  }

  let existing: Record<string, unknown> = {};
  if (existingStyleJson) {
    try {
      const parsed = JSON.parse(existingStyleJson);
      if (parsed && typeof parsed === "object") existing = parsed;
    } catch {
      // ungueltiges bestehendes JSON — wie bisher, faengt bei leerem Objekt an
    }
  }

  const fontId = String(formData.get("fontId") ?? "").trim();
  const ornaments = formData.get("ornaments") === "on";
  const style: Record<string, unknown> = {};
  if (fontId) style.fontId = fontId;
  if (ornaments) style.ornaments = true;
  if (existing.photoShape) style.photoShape = existing.photoShape;
  if (existing.showFloral) style.showFloral = existing.showFloral;
  if (existing.showPhotoBackground) style.showPhotoBackground = existing.showPhotoBackground;

  // Abschnitts-Reihenfolge (Inline-Umsortieren am Element, siehe
  // ReorderableSection.tsx) — als JSON-Array-String im Formular, sonst wie
  // bisher aus dem bestehenden styleJson uebernommen (z.B. wenn nur die
  // Farbe geaendert wurde).
  const sectionOrderRaw = String(formData.get("sectionOrder") ?? "").trim();
  if (sectionOrderRaw) {
    try {
      const parsed = JSON.parse(sectionOrderRaw);
      if (Array.isArray(parsed)) style.sectionOrder = parsed;
    } catch {
      if (Array.isArray(existing.sectionOrder)) style.sectionOrder = existing.sectionOrder;
    }
  } else if (Array.isArray(existing.sectionOrder)) {
    style.sectionOrder = existing.sectionOrder;
  }

  type ElementEntry = {
    size?: string;
    color?: string;
    fontId?: string;
    align?: string;
    bold?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    italic?: boolean;
  };
  const elements: Record<string, ElementEntry> = {};
  // TEXT_ELEMENT_KEYS statt einer eigenen, hier zuvor gepflegten Kopie —
  // diese Kopie war bereits um "location" veraltet (Stil-Aenderungen fuer
  // Ort wurden dadurch nie gespeichert, siehe Schritt 3), ein neuer Key
  // wuerde hier sonst beim naechsten Mal wieder stillschweigend verworfen.
  for (const key of TEXT_ELEMENT_KEYS) {
    const size = String(formData.get(`${key}Size`) ?? "").trim();
    const colorOn = formData.get(`${key}ColorOn`) === "on";
    const color = colorOn ? String(formData.get(`${key}Color`) ?? "").trim() : "";
    const elFontId = String(formData.get(`${key}FontId`) ?? "").trim();
    const align = String(formData.get(`${key}Align`) ?? "").trim();
    const bold = formData.get(`${key}Bold`) === "on";
    const underline = formData.get(`${key}Underline`) === "on";
    const strikethrough = formData.get(`${key}Strikethrough`) === "on";
    const italic = formData.get(`${key}Italic`) === "on";
    const entry: ElementEntry = {};
    if (size && size !== "md") entry.size = size;
    if (color) entry.color = color;
    if (elFontId) entry.fontId = elFontId;
    if (align && align !== "center") entry.align = align;
    if (bold) entry.bold = true;
    if (underline) entry.underline = true;
    if (strikethrough) entry.strikethrough = true;
    if (italic) entry.italic = true;
    if (Object.keys(entry).length > 0) elements[key] = entry;
  }
  if (Object.keys(elements).length > 0) style.elements = elements;

  return { colorOverride: JSON.stringify(override), styleJson: JSON.stringify(style) };
}
