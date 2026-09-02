import { qrSvg } from "./qr";

export type PrintSize = "A6" | "A5";

// Physische Groessen in mm — SVG unterstuetzt mm direkt als Einheit fuer
// width/height, dadurch stimmt der Massstab beim Drucken (aus Browser oder
// Vektorprogramm) automatisch, ohne DPI-Umrechnung.
export const PRINT_SIZE_MM: Record<PrintSize, { width: number; height: number; label: string }> = {
  A6: { width: 105, height: 148, label: "A6 (105 × 148 mm) — Tischkarte" },
  A5: { width: 148, height: 210, label: "A5 (148 × 210 mm) — Aufsteller" },
};

// PLATZHALTER-Preise pro Stueck, NICHT aus Marktrecherche abgeleitet
// (anders als das Foto/Video-Add-on) — haengen von den eigenen Druck-/
// Portokosten ab, die nur der Betreiber selbst kennt. Vor dem Live-Gang
// unbedingt anpassen. Zentral hier statt in actions.ts, damit die in der
// UI angezeigten Preise nie von den tatsaechlich berechneten abweichen.
export const PRINT_PRICE_CENTS: Record<PrintSize, number> = {
  A6: 290,
  A5: 390,
};

// Mengenrabatt-Stufen (Rabatt auf den Stueckpreis oben), Schwellwerte
// PLATZHALTER — vor dem Live-Gang mit echten Druck-/Portokosten pruefen.
// Absteigend sortiert, damit priceTierForQuantity() beim ersten Treffer
// (quantity >= threshold) abbrechen kann.
export const PRINT_QUANTITY_TIERS: Array<{ minQuantity: number; discount: number; label: string }> = [
  { minQuantity: 100, discount: 0.3, label: "ab 100 Stück: −30 %" },
  { minQuantity: 50, discount: 0.2, label: "ab 50 Stück: −20 %" },
  { minQuantity: 25, discount: 0.1, label: "ab 25 Stück: −10 %" },
  { minQuantity: 1, discount: 0, label: "1–24 Stück: regulärer Preis" },
];

function priceTierForQuantity(quantity: number) {
  return PRINT_QUANTITY_TIERS.find((tier) => quantity >= tier.minQuantity)!;
}

// Gesamtpreis inkl. Mengenrabatt, auf volle Cent gerundet — einzige Stelle,
// die den tatsaechlich zu berechnenden Preis kennt, damit UI-Anzeige und
// Stripe-Checkout nie auseinanderlaufen.
export function printOrderPriceCents(size: PrintSize, quantity: number): number {
  const tier = priceTierForQuantity(quantity);
  return Math.round(PRINT_PRICE_CENTS[size] * quantity * (1 - tier.discount));
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// qrSvg() liefert ein eigenstaendiges <svg viewBox="0 0 N N">...</svg> —
// wird hier als verschachteltes <svg> in die groessere Design-Vorlage
// eingebettet (SVG unterstuetzt das nativ), statt es per Rasterbild/base64
// einzubinden.
function extractQrInner(svg: string): { viewBox: string; inner: string } {
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return {
    viewBox: viewBoxMatch?.[1] ?? "0 0 31 31",
    inner: innerMatch?.[1] ?? "",
  };
}

export type QrTheme = "classic" | "modern-block" | "gold-frame";

export const QR_THEMES: Array<{ id: QrTheme; label: string }> = [
  { id: "classic", label: "Klassisch — schlichter Rahmen" },
  { id: "modern-block", label: "Modern — kräftige Farbfläche" },
  { id: "gold-frame", label: "Opulent — Doppellinie mit Eckakzenten" },
];

type QrDesignParams = {
  size: PrintSize;
  title: string;
  subtitle?: string;
  instructions?: string;
  targetUrl: string;
  primary?: string;
  accent?: string;
  background?: string;
};

type ThemeInput = QrDesignParams & { width: number; height: number; primary: string; accent: string; background: string; qr: { viewBox: string; inner: string }; instructions: string };

function classicTheme(p: ThemeInput): string {
  const { width, height, primary, accent, background, qr, instructions } = p;
  const qrSizeMm = width * 0.55;
  const qrX = (width - qrSizeMm) / 2;
  const qrY = height * 0.32;

  return `<rect width="${width}" height="${height}" fill="${background}" />
  <rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="${accent}" stroke-width="0.4" />
  <text x="${width / 2}" y="${height * 0.14}" text-anchor="middle" font-family="Georgia, serif" font-size="6" fill="${primary}">${escapeXml(p.title)}</text>
  ${p.subtitle ? `<text x="${width / 2}" y="${height * 0.14 + 8}" text-anchor="middle" font-family="sans-serif" font-size="3.2" fill="${accent}" letter-spacing="0.3">${escapeXml(p.subtitle)}</text>` : ""}
  <svg x="${qrX}" y="${qrY}" width="${qrSizeMm}" height="${qrSizeMm}" viewBox="${qr.viewBox}">${qr.inner}</svg>
  <text x="${width / 2}" y="${qrY + qrSizeMm + 8}" text-anchor="middle" font-family="sans-serif" font-size="3.4" fill="${primary}">${escapeXml(instructions)}</text>
  <text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-family="sans-serif" font-size="2.6" fill="${accent}" letter-spacing="0.2">EINLADI.DE</text>`;
}

// Kraeftige Farbflaeche statt zurueckhaltendem Rahmen — die QR-Karte selbst
// wird zum Blickfang auf dem Tisch. Der QR-Code sitzt auf einer weissen
// Karte (Kontrast/Scanbarkeit bleibt unabhaengig von der Akzentfarbe hoch).
function modernBlockTheme(p: ThemeInput): string {
  const { width, height, accent, qr, instructions } = p;
  const cardSizeMm = width * 0.62;
  const cardX = (width - cardSizeMm) / 2;
  const cardY = height * 0.3;
  const qrSizeMm = cardSizeMm * 0.82;
  const qrX = cardX + (cardSizeMm - qrSizeMm) / 2;
  const qrY = cardY + (cardSizeMm - qrSizeMm) / 2;

  return `<rect width="${width}" height="${height}" fill="${accent}" />
  <text x="${width / 2}" y="${height * 0.14}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="6.2" fill="#FFFFFF" letter-spacing="0.4">${escapeXml(p.title.toUpperCase())}</text>
  ${p.subtitle ? `<text x="${width / 2}" y="${height * 0.14 + 7.5}" text-anchor="middle" font-family="sans-serif" font-size="3" fill="#FFFFFFCC" letter-spacing="0.5">${escapeXml(p.subtitle.toUpperCase())}</text>` : ""}
  <rect x="${cardX}" y="${cardY}" width="${cardSizeMm}" height="${cardSizeMm}" fill="#FFFFFF" rx="2.5" />
  <svg x="${qrX}" y="${qrY}" width="${qrSizeMm}" height="${qrSizeMm}" viewBox="${qr.viewBox}">${qr.inner}</svg>
  <text x="${width / 2}" y="${cardY + cardSizeMm + 9}" text-anchor="middle" font-family="sans-serif" font-size="3.4" fill="#FFFFFF">${escapeXml(instructions)}</text>
  <text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-family="sans-serif" font-size="2.6" fill="#FFFFFFAA" letter-spacing="0.3">EINLADI.DE</text>`;
}

// Doppellinien-Rahmen mit kleinen Eck-Akzenten (diagonale Striche statt
// botanischer Illustration — als handgeschriebenes SVG zuverlaessig sauber
// darstellbar) und kursiver Serifenschrift — angelehnt an klassische
// Hochzeits-Einladungskarten, passend zum tuerkisch-/kurdischsprachigen
// Hochzeitssaal-Publikum (opulente, aber elegante Optik).
function goldFrameTheme(p: ThemeInput): string {
  const { width, height, primary, accent, background, qr, instructions } = p;
  const outerMargin = 4;
  const innerMargin = 6.5;
  const qrSizeMm = width * 0.52;
  const qrX = (width - qrSizeMm) / 2;
  const qrY = height * 0.33;
  const corner = 6;

  const corners = [
    [innerMargin, innerMargin, innerMargin + corner, innerMargin, innerMargin, innerMargin + corner],
    [width - innerMargin, innerMargin, width - innerMargin - corner, innerMargin, width - innerMargin, innerMargin + corner],
    [innerMargin, height - innerMargin, innerMargin + corner, height - innerMargin, innerMargin, height - innerMargin - corner],
    [width - innerMargin, height - innerMargin, width - innerMargin - corner, height - innerMargin, width - innerMargin, height - innerMargin - corner],
  ]
    .map(([x, y, x1, y1, x2, y2]) => `<path d="M ${x1} ${y1} L ${x} ${y} L ${x2} ${y2}" fill="none" stroke="${accent}" stroke-width="0.35" />`)
    .join("\n  ");

  return `<rect width="${width}" height="${height}" fill="${background}" />
  <rect x="${outerMargin}" y="${outerMargin}" width="${width - outerMargin * 2}" height="${height - outerMargin * 2}" fill="none" stroke="${accent}" stroke-width="0.25" />
  <rect x="${innerMargin}" y="${innerMargin}" width="${width - innerMargin * 2}" height="${height - innerMargin * 2}" fill="none" stroke="${accent}" stroke-width="0.25" />
  ${corners}
  <text x="${width / 2}" y="${height * 0.16}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="6.5" fill="${primary}">${escapeXml(p.title)}</text>
  <line x1="${width / 2 - 10}" y1="${height * 0.16 + 4}" x2="${width / 2 + 10}" y2="${height * 0.16 + 4}" stroke="${accent}" stroke-width="0.3" />
  ${p.subtitle ? `<text x="${width / 2}" y="${height * 0.16 + 9}" text-anchor="middle" font-family="sans-serif" font-size="3" fill="${accent}" letter-spacing="0.6">${escapeXml(p.subtitle.toUpperCase())}</text>` : ""}
  <svg x="${qrX}" y="${qrY}" width="${qrSizeMm}" height="${qrSizeMm}" viewBox="${qr.viewBox}">${qr.inner}</svg>
  <text x="${width / 2}" y="${qrY + qrSizeMm + 8}" text-anchor="middle" font-family="sans-serif" font-size="3.2" fill="${primary}" letter-spacing="0.2">${escapeXml(instructions)}</text>
  <text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="2.8" fill="${accent}" letter-spacing="0.4">einladi.de</text>`;
}

// Baut eine druckfertige SVG-"Tischkarte"/"Aufsteller" mit QR-Code,
// Titel/Untertitel und Anleitungstext. Keine neue Abhaengigkeit (kein
// Canvas/PDF-Renderer) — reine SVG-String-Komposition. `theme` waehlt
// zwischen mehreren eigenstaendigen Layouts (nicht nur Farbvarianten).
export async function buildQrDesignSvg(params: QrDesignParams & { theme?: QrTheme }): Promise<string> {
  const { width, height } = PRINT_SIZE_MM[params.size];
  const primary = params.primary ?? "#211C19";
  const accent = params.accent ?? "#B9975B";
  const background = params.background ?? "#FAF6EF";
  const instructions = params.instructions ?? "Scannt den Code, um Fotos & Videos zu teilen";

  const rawQr = await qrSvg(params.targetUrl);
  const qr = extractQrInner(rawQr);

  const input: ThemeInput = { ...params, width, height, primary, accent, background, qr, instructions };
  const body =
    params.theme === "modern-block" ? modernBlockTheme(input) : params.theme === "gold-frame" ? goldFrameTheme(input) : classicTheme(input);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  ${body}
</svg>`;
}
