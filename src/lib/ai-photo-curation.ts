const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiPhotoCurationConfigured = Boolean(OPENAI_API_KEY);

// Kostendeckel — mehr Fotos pro Aufruf waeren ein sehr grosses Payload
// (mehrere Bild-URLs in einer Anfrage) und schwerer zuverlaessig als JSON
// mit korrekter id-Zuordnung auswertbar. Bei mehr ausstehenden Fotos
// werden nur die aeltesten QUOTA analysiert (siehe memories/actions.ts).
export const PHOTO_CURATION_BATCH_LIMIT = 20;

export type PhotoVerdict = "empfehlung" | "unscharf" | "duplikat" | "ok";

export type PhotoCurationResult = { id: string; verdict: PhotoVerdict; reason: string };

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

// Bewertet eine Reihe von Gaeste-Fotos in einem einzigen Aufruf (guenstiger
// und schneller als N Einzelaufrufe) — Modell bekommt jedes Foto als
// image_url-Content-Part zusammen mit dessen id, damit die Zuordnung in
// der Antwort eindeutig ist.
export async function analyzePhotos(photos: { id: string; url: string }[]): Promise<PhotoCurationResult[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — die Foto-Kuration ist nicht konfiguriert.");
  }
  if (photos.length === 0) return [];

  const imageContent = photos.flatMap((p) => [
    { type: "text" as const, text: `Foto-ID: ${p.id}` },
    { type: "image_url" as const, image_url: { url: p.url } },
  ]);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du bewertest Hochzeits-/Feier-Fotos, die Gaeste hochgeladen haben, damit der Gastgeber schneller " +
            "moderieren kann. Fuer jedes Foto (identifiziert per vorangestellter Foto-ID) vergib genau eines: " +
            '"empfehlung" (besonders gutes, scharfes, gut komponiertes Foto), "unscharf" (deutlich verwackelt/ ' +
            'unscharf), "duplikat" (sieht einem anderen Foto in dieser Reihe sehr aehnlich), oder "ok" (normal, ' +
            "keine Auffaelligkeit). Antworte ausschliesslich als JSON-Objekt: " +
            '{"results": [{"id": "<Foto-ID>", "verdict": "empfehlung|unscharf|duplikat|ok", "reason": "<ein kurzer Satz>"}, ...]}. ' +
            "Fuer jede genannte Foto-ID genau ein Ergebnis, keine zusaetzlichen.",
        },
        { role: "user", content: imageContent },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Fotoanalyse fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: { results?: PhotoCurationResult[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!Array.isArray(parsed.results)) throw new Error("OpenAI-Antwort enthielt keine Ergebnisse.");

  return parsed.results;
}
