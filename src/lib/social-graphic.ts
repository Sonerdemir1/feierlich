export type SocialGraphicFormat = "story" | "post";

export const SOCIAL_GRAPHIC_SIZES: Record<SocialGraphicFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: "Story (1080 × 1920)" },
  post: { width: 1080, height: 1080, label: "Beitrag (1080 × 1080)" },
};

// Laedt eine Google-Font-Datei als TTF fuer next/og (Satori unterstuetzt nur
// ttf/otf/woff, kein woff2). Der text-Parameter subsettet die Anfrage auf
// die tatsaechlich gebrauchten Zeichen (schneller/kleiner) UND sorgt dafuer,
// dass Google ueberhaupt eine ttf-Variante ausliefert — mit modernem
// Browser-User-Agent bekaeme man sonst nur woff2, daher bewusst ohne
// gesetzten UA-Header (Server-Fetch ohne UA gilt als "alter Client").
export async function loadGoogleFont(family: string, text: string, weight: number): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl).then((r) => r.text());
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`Google Font "${family}" nicht gefunden.`);
  const res = await fetch(match[1]);
  if (!res.ok) throw new Error(`Google Font "${family}" konnte nicht geladen werden.`);
  return res.arrayBuffer();
}
