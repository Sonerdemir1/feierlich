const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiDesignConfigured = Boolean(OPENAI_API_KEY);

export const AI_DESIGN_ADDON_KEY = "ai-design";

// Kontingent pro Event, nicht pro Kauf-Datensatz — schuetzt vor
// unkontrollierten Kosten unabhaengig davon, ob die Zahlung fuer das
// AddOn bereits abgewickelt wurde (Abwicklung laeuft vorerst manuell,
// gleiches Muster wie bei PrintOrder). Bei Bedarf anpassen, sobald echte
// Nutzungs-/Kostendaten vorliegen.
export const AI_DESIGN_ATTEMPT_QUOTA = 10;

type OpenAiImagesEditResponse = { data?: Array<{ b64_json?: string }> };

// Bild-zu-Bild-Bearbeitung (nicht Neugenerierung von Grund auf) — das
// hochgeladene Foto bleibt als Basis erhalten, nur die per Prompt
// beschriebenen Aspekte (Hintergrund, Lichtstimmung, ...) werden
// angepasst. Wichtig fuer Hochzeitsfotos: die abgebildeten Personen
// duerfen nicht durch ein KI-Fantasiebild ersetzt werden.
export async function generateAiDesignImage(source: Buffer, mimeType: string, prompt: string): Promise<Buffer> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — KI-Design ist nicht konfiguriert.");
  }

  const form = new FormData();
  form.set("model", "gpt-image-2");
  form.append("image[]", new Blob([new Uint8Array(source)], { type: mimeType }), "image");
  form.set("prompt", prompt);
  form.set("size", "1024x1024");
  form.set("quality", "medium");
  form.set("n", "1");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Bildbearbeitung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiImagesEditResponse;
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI-Antwort enthielt kein Bild.");

  return Buffer.from(b64, "base64");
}
