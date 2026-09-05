import { qrSvg } from "./qr";
import { loadGoogleFont } from "./social-graphic";
import { fontOptionById } from "./fonts";

export type PrintSize = "A6" | "A5" | "A4";

// Physische Groessen in mm — SVG unterstuetzt mm direkt als Einheit fuer
// width/height, dadurch stimmt der Massstab beim Drucken (aus Browser oder
// Vektorprogramm) automatisch, ohne DPI-Umrechnung.
export const PRINT_SIZE_MM: Record<PrintSize, { width: number; height: number; label: string }> = {
  A6: { width: 105, height: 148, label: "A6 (105 × 148 mm) — Tischkarte" },
  A5: { width: 148, height: 210, label: "A5 (148 × 210 mm) — Aufsteller" },
  A4: { width: 210, height: 297, label: "A4 (210 × 297 mm) — Willkommensschild" },
};

// PLATZHALTER-Preise pro Stueck, NICHT aus Marktrecherche abgeleitet
// (anders als das Foto/Video-Add-on) — haengen von den eigenen Druck-/
// Portokosten ab, die nur der Betreiber selbst kennt. Vor dem Live-Gang
// unbedingt anpassen. Zentral hier statt in actions.ts, damit die in der
// UI angezeigten Preise nie von den tatsaechlich berechneten abweichen.
export const PRINT_PRICE_CENTS: Record<PrintSize, number> = {
  A6: 290,
  A5: 390,
  A4: 590,
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
  // Optional — eine der Schriftart-IDs aus src/lib/fonts.ts (dieselbe Auswahl
  // wie im Design-Editor). Ohne Angabe bleibt es bei der bisherigen festen
  // Theme-Schrift (Georgia/Helvetica), kein Verhaltensunterschied.
  fontId?: string;
};

type ThemeInput = QrDesignParams & {
  width: number;
  height: number;
  primary: string;
  accent: string;
  background: string;
  qr: { viewBox: string; inner: string };
  instructions: string;
  headingFamily: string;
};

function classicTheme(p: ThemeInput): string {
  const { width, height, primary, accent, background, qr, instructions, headingFamily } = p;
  const qrSizeMm = width * 0.55;
  const qrX = (width - qrSizeMm) / 2;
  const qrY = height * 0.32;

  return `<rect width="${width}" height="${height}" fill="${background}" />
  <rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="${accent}" stroke-width="0.4" />
  <text x="${width / 2}" y="${height * 0.14}" text-anchor="middle" font-family="${headingFamily}" font-size="6" fill="${primary}">${escapeXml(p.title)}</text>
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

// Zeichnet vier kurze Eck-Winkel (Klammern) um ein Rechteck — genutzt fuer
// den aeusseren Seitenrahmen UND den QR-Platzhalter-Rahmen, damit beide
// exakt denselben Akzent-Stil teilen statt zwei separaten Implementierungen.
function cornerBrackets(x: number, y: number, w: number, h: number, size: number, color: string, strokeWidth = 0.35): string {
  return [
    [x, y, x + size, y, x, y + size],
    [x + w, y, x + w - size, y, x + w, y + size],
    [x, y + h, x + size, y + h, x, y + h - size],
    [x + w, y + h, x + w - size, y + h, x + w, y + h - size],
  ]
    .map(([cx, cy, x1, y1, x2, y2]) => `<path d="M ${x1} ${y1} L ${cx} ${cy} L ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" />`)
    .join("\n  ");
}

// Sehr einfacher Greedy-Umbruch nach Zeichenanzahl statt echter
// Textbreiten-Messung (im SVG-String ohne DOM/Canvas nicht verfuegbar) —
// reicht fuer kurze Anleitungstexte auf einer Druckvorlage.
function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

// Zierrahmen mit Zweig-Icon, Skript-Ueberschrift, verziertem Trenner,
// gepunktetem QR-Platzhalter mit Eck-Klammern und eigener Namens-/
// Tischkarten-Box darunter — orientiert an klassischen, opulenten
// Hochzeits-QR-Karten (Referenz: "QR CARD"-Ordner), aber vollstaendig
// farbparametrisiert (primary/accent/background), damit es zur jeweils
// gewaehlten Vorlagenfarbe passt statt nur zu einer festen Gold-Palette.
function goldFrameTheme(p: ThemeInput): string {
  const { width, height, primary, accent, background, qr, instructions, headingFamily } = p;
  // Referenzbreite A6 (105mm) = Faktor 1 — alle sonst festen mm-Abstaende/
  // Schriftgroessen skalieren hierueber mit, sonst haeuft sich bei A4 (doppelte
  // Breite) der ganze Inhalt oben und laesst unten ein unproportioniert
  // grosses Leerfeld (beim Testen mit allen drei Formaten aufgefallen).
  const s = width / 105;
  const outerMargin = 4;
  const innerMargin = 6.5;
  const outerCorners = cornerBrackets(innerMargin, innerMargin, width - innerMargin * 2, height - innerMargin * 2, 6 * s, accent);

  // Zweig-Icon: symmetrischer Stiel mit drei Blattpaaren, komplett aus
  // Pfaden gezeichnet (keine Rasterbilder) — skaliert mit der Kartengroesse.
  const leafCx = width / 2;
  const leafTopY = height * 0.09;
  const leafScale = s * 0.45;
  const branch = `<g transform="translate(${leafCx} ${leafTopY}) scale(${leafScale})">
    <path d="M0,15 C0,8 -0.5,2 0,-11" stroke="${accent}" stroke-width="0.45" fill="none" stroke-linecap="round" />
    <path d="M0,11 C-3.4,9 -5.4,5.6 -4.4,2.4 C-1.2,3.4 0,6.6 0,11 Z" fill="${accent}" />
    <path d="M0,11 C3.4,9 5.4,5.6 4.4,2.4 C1.2,3.4 0,6.6 0,11 Z" fill="${accent}" />
    <path d="M0,3.5 C-2.7,1.7 -4.3,-0.8 -3.3,-3.4 C-0.9,-2.3 0,0.2 0,3.5 Z" fill="${accent}" />
    <path d="M0,3.5 C2.7,1.7 4.3,-0.8 3.3,-3.4 C0.9,-2.3 0,0.2 0,3.5 Z" fill="${accent}" />
    <path d="M0,-4 C-2,-5.5 -3,-7.6 -2,-9.6 C-0.5,-8.5 0,-6.4 0,-4 Z" fill="${accent}" />
  </g>`;

  const headingY = height * 0.2;
  const scriptText = (p.subtitle ?? p.title).trim();
  const dividerY = headingY + 8.5 * s;

  const bodyLineHeight = 4.6 * s;
  const bodyLines = wrapLines(instructions, width * 0.34, 3);
  const bodyStartY = dividerY + 8 * s;
  const body = bodyLines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${bodyStartY + i * bodyLineHeight}" text-anchor="middle" font-family="Georgia, serif" font-size="${3.4 * s}" fill="${primary}">${escapeXml(line)}</text>`
    )
    .join("\n  ");

  const qrSizeMm = width * 0.5;
  const qrX = (width - qrSizeMm) / 2;
  const qrY = bodyStartY + bodyLines.length * bodyLineHeight + 6 * s;
  const framePad = 2.6 * s;
  const frameCorner = 5 * s;

  const nameBoxY = qrY + qrSizeMm + 10 * s;
  const nameBoxH = height * 0.055;
  const nameBoxW = width * 0.62;
  const nameBoxX = (width - nameBoxW) / 2;

  return `<rect width="${width}" height="${height}" fill="${background}" />
  <rect x="${outerMargin}" y="${outerMargin}" width="${width - outerMargin * 2}" height="${height - outerMargin * 2}" fill="none" stroke="${accent}" stroke-width="0.25" />
  <rect x="${innerMargin}" y="${innerMargin}" width="${width - innerMargin * 2}" height="${height - innerMargin * 2}" fill="none" stroke="${accent}" stroke-width="0.25" />
  ${outerCorners}
  ${branch}
  <text x="${width / 2}" y="${headingY}" text-anchor="middle" font-family="${headingFamily}" font-style="italic" font-size="${7.2 * s}" fill="${primary}">${escapeXml(scriptText)}</text>
  <line x1="${width / 2 - 11 * s}" y1="${dividerY}" x2="${width / 2 - 3 * s}" y2="${dividerY}" stroke="${accent}" stroke-width="0.3" />
  <rect x="${width / 2 - 1.2 * s}" y="${dividerY - 1.2 * s}" width="${2.4 * s}" height="${2.4 * s}" fill="none" stroke="${accent}" stroke-width="0.3" transform="rotate(45 ${width / 2} ${dividerY})" />
  <line x1="${width / 2 + 3 * s}" y1="${dividerY}" x2="${width / 2 + 11 * s}" y2="${dividerY}" stroke="${accent}" stroke-width="0.3" />
  ${body}
  <rect x="${qrX - framePad}" y="${qrY - framePad}" width="${qrSizeMm + framePad * 2}" height="${qrSizeMm + framePad * 2}" fill="none" stroke="${accent}" stroke-width="0.3" stroke-dasharray="0.6 1.4" />
  ${cornerBrackets(qrX - framePad, qrY - framePad, qrSizeMm + framePad * 2, qrSizeMm + framePad * 2, frameCorner, accent, 0.45)}
  <svg x="${qrX}" y="${qrY}" width="${qrSizeMm}" height="${qrSizeMm}" viewBox="${qr.viewBox}">${qr.inner}</svg>
  <rect x="${nameBoxX}" y="${nameBoxY}" width="${nameBoxW}" height="${nameBoxH}" fill="none" stroke="${accent}" stroke-width="0.3" />
  <text x="${width / 2}" y="${nameBoxY + nameBoxH / 2 + 1.3 * s}" text-anchor="middle" font-family="${headingFamily}" font-weight="700" font-size="${4 * s}" letter-spacing="0.3" fill="${primary}">${escapeXml(p.title.toUpperCase())}</text>
  <text x="${width / 2}" y="${height - 8 * s}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${2.8 * s}" fill="${accent}" letter-spacing="0.4">einladi.de</text>`;
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

  // Eigene Schrift statt der festen Theme-Schrift: dieselbe Google-Font-Datei
  // wie bei der Social-Grafik (next/og) laden, aber hier als base64 @font-face
  // direkt im SVG einbetten — die Datei ist eigenstaendig (SVG kennt keine
  // next/font-CSS-Variablen), funktioniert dadurch auch im <img>-Tag der
  // Vorschau und in der heruntergeladenen Datei.
  let fontFaceStyle = "";
  let headingFamily = "Georgia, serif";
  const chosenFont = fontOptionById(params.fontId);
  if (chosenFont) {
    try {
      const text = `${params.title} ${params.subtitle ?? ""}`;
      const fontData = await loadGoogleFont(chosenFont.googleFamily, text, 600);
      const base64 = Buffer.from(fontData).toString("base64");
      fontFaceStyle = `<style>@font-face { font-family: "${chosenFont.googleFamily}"; src: url(data:font/ttf;base64,${base64}) format("truetype"); font-weight: 600; }</style>`;
      // Einfache Anfuehrungszeichen, nicht doppelte — headingFamily landet in
      // einem SVG-Attribut, das selbst in doppelten Anfuehrungszeichen steht
      // (font-family="..."); doppelte Zeichen hier wuerden das Attribut
      // vorzeitig schliessen und die SVG-Datei als ungueltiges XML kaputt
      // machen (im Browser als "attributes construct error" sichtbar).
      headingFamily = `'${chosenFont.googleFamily}', Georgia, serif`;
    } catch {
      // Google Fonts nicht erreichbar — Karte bleibt bei der bisherigen
      // Standardschrift nutzbar statt komplett zu scheitern.
    }
  }

  const input: ThemeInput = { ...params, width, height, primary, accent, background, qr, instructions, headingFamily };
  const body =
    params.theme === "modern-block" ? modernBlockTheme(input) : params.theme === "gold-frame" ? goldFrameTheme(input) : classicTheme(input);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  ${fontFaceStyle}
  ${body}
</svg>`;
}
