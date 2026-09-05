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
async function fetchGoogleFontFile(family: string, text: string, weight: number): Promise<ArrayBuffer | null> {
  // Leerzeichen im Familiennamen muessen als "+" kodiert sein, nicht als
  // "%20" (encodeURIComponent-Standard) — mit %20 antwortet die css2-API mit
  // 400 "Font family not found" fuer JEDEN mehrteiligen Namen (z.B. "Playfair
  // Display", "Great Vibes"), das try/catch oben schluckte das bisher still,
  // wodurch Satori immer auf seine eingebaute Standardschrift zurueckfiel.
  const familyParam = encodeURIComponent(family).replace(/%20/g, "+");
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl).then((r) => r.text());
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) return null;
  const res = await fetch(match[1]);
  if (!res.ok) return null;
  return res.arrayBuffer();
}

// Manche Schriften (v.a. Skript-/Zierschriften wie "Great Vibes") gibt es nur
// in einer einzigen Schnittstaerke — eine Anfrage mit z.B. wght@600 liefert
// dann "400 Font family not found", obwohl die Schrift existiert. Deshalb bei
// Fehlschlag einmal mit der Standardstaerke 400 erneut versuchen, statt die
// ganze Karte auf die eingebaute Ersatzschrift zurueckfallen zu lassen.
export async function loadGoogleFont(family: string, text: string, weight: number): Promise<ArrayBuffer> {
  const data = (await fetchGoogleFontFile(family, text, weight)) ?? (weight !== 400 ? await fetchGoogleFontFile(family, text, 400) : null);
  if (!data) throw new Error(`Google Font "${family}" nicht gefunden.`);
  return data;
}
