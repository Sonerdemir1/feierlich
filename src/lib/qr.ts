import QRCode from "qrcode";

export type QrColors = { dark?: string; light?: string };

const DEFAULT_DARK = "#211C19";
const DEFAULT_LIGHT = "#FAF6EF";

export async function qrSvg(url: string, colors: QrColors = {}): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: colors.dark ?? DEFAULT_DARK, light: colors.light ?? DEFAULT_LIGHT },
  });
}

export async function qrPng(url: string, colors: QrColors = {}): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    margin: 1,
    width: 512,
    color: { dark: colors.dark ?? DEFAULT_DARK, light: colors.light ?? DEFAULT_LIGHT },
  });
}

function relativeLuminance(hex: string): number | null {
  const m = hex.replace("#", "");
  if (m.length !== 6) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  if ([r, g, b].some((c) => Number.isNaN(c))) return null;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// QR-Codes brauchen starken Hell/Dunkel-Kontrast, um zuverlaessig scanbar zu
// bleiben — die Event-Farben (primary/background) direkt zu uebernehmen
// waere bei dunklen Vorlagen (z.B. "Onyx", "Mitternacht") riskant, wenn
// beide Farben aehnlich hell/dunkel sind. Fallback auf die bewaehrten
// Standardfarben, sobald eine Farbe nicht eindeutig hell bzw. dunkel genug ist.
export function safeQrColorsFromEvent(primary: string, background: string): { dark: string; light: string } {
  const bgLum = relativeLuminance(background);
  const primaryLum = relativeLuminance(primary);
  const light = bgLum !== null && bgLum > 0.6 ? background : DEFAULT_LIGHT;
  const dark = primaryLum !== null && primaryLum < 0.4 ? primary : DEFAULT_DARK;
  return { dark, light };
}
