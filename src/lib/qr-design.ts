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

// Baut eine druckfertige SVG-"Tischkarte"/"Aufsteller" mit QR-Code,
// Titel/Untertitel und Anleitungstext. Keine neue Abhaengigkeit (kein
// Canvas/PDF-Renderer) — reine SVG-String-Komposition.
export async function buildQrDesignSvg(params: {
  size: PrintSize;
  title: string;
  subtitle?: string;
  instructions?: string;
  targetUrl: string;
  primary?: string;
  accent?: string;
}): Promise<string> {
  const { width, height } = PRINT_SIZE_MM[params.size];
  const primary = params.primary ?? "#211C19";
  const accent = params.accent ?? "#B9975B";

  const rawQr = await qrSvg(params.targetUrl);
  const { viewBox, inner } = extractQrInner(rawQr);

  const qrSizeMm = width * 0.55;
  const qrX = (width - qrSizeMm) / 2;
  const qrY = height * 0.32;
  const instructions = params.instructions ?? "Scannt den Code, um Fotos & Videos zu teilen";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#FAF6EF" />
  <rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="${accent}" stroke-width="0.4" />
  <text x="${width / 2}" y="${height * 0.14}" text-anchor="middle" font-family="Georgia, serif" font-size="6" fill="${primary}">${escapeXml(params.title)}</text>
  ${params.subtitle ? `<text x="${width / 2}" y="${height * 0.14 + 8}" text-anchor="middle" font-family="sans-serif" font-size="3.2" fill="${accent}" letter-spacing="0.3">${escapeXml(params.subtitle)}</text>` : ""}
  <svg x="${qrX}" y="${qrY}" width="${qrSizeMm}" height="${qrSizeMm}" viewBox="${viewBox}">${inner}</svg>
  <text x="${width / 2}" y="${qrY + qrSizeMm + 8}" text-anchor="middle" font-family="sans-serif" font-size="3.4" fill="${primary}">${escapeXml(instructions)}</text>
  <text x="${width / 2}" y="${height - 6}" text-anchor="middle" font-family="sans-serif" font-size="2.6" fill="${accent}" letter-spacing="0.2">EINLADI.DE</text>
</svg>`;
}
