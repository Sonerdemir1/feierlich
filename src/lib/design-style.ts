// Baut colorOverride/styleJson aus dem Design-Formular (Farben, Schriftart,
// Verzierungen, Pro-Element-Feinsteuerung) — geteilt zwischen der
// server-action-Variante (saveDesign, src/app/dashboard/events/actions.ts,
// non-JS-Fallback + Vorlagenwechsel-Reset) und der Live-Sync-Route
// (src/app/dashboard/events/[id]/design/route.ts, kein Redirect/Remount).
// Reine Datenfunktion, kein "use server" hier — sonst wuerde Next.js sie
// selbst als Server Action behandeln.
export function buildDesignUpdate(formData: FormData): { colorOverride: string; styleJson: string } {
  const override: Record<string, string> = {};
  for (const key of ["primary", "accent", "background"] as const) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) override[key] = value;
  }

  const fontId = String(formData.get("fontId") ?? "").trim();
  const ornaments = formData.get("ornaments") === "on";
  const style: Record<string, unknown> = {};
  if (fontId) style.fontId = fontId;
  if (ornaments) style.ornaments = true;

  const elements: Record<string, { size?: string; color?: string; fontId?: string; align?: string }> = {};
  for (const key of ["eventLabel", "title", "subtitle", "family", "date", "description"] as const) {
    const size = String(formData.get(`${key}Size`) ?? "").trim();
    const colorOn = formData.get(`${key}ColorOn`) === "on";
    const color = colorOn ? String(formData.get(`${key}Color`) ?? "").trim() : "";
    const elFontId = String(formData.get(`${key}FontId`) ?? "").trim();
    const align = String(formData.get(`${key}Align`) ?? "").trim();
    const entry: { size?: string; color?: string; fontId?: string; align?: string } = {};
    if (size && size !== "md") entry.size = size;
    if (color) entry.color = color;
    if (elFontId) entry.fontId = elFontId;
    if (align && align !== "center") entry.align = align;
    if (Object.keys(entry).length > 0) elements[key] = entry;
  }
  if (Object.keys(elements).length > 0) style.elements = elements;

  return { colorOverride: JSON.stringify(override), styleJson: JSON.stringify(style) };
}
