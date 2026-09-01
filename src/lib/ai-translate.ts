const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiTranslateConfigured = Boolean(OPENAI_API_KEY);

export type TranslationResult = {
  detectedLanguage: string;
  translatedText: string | null;
};

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

// Erkennt die Sprache einer Gaestebuch-Nachricht und uebersetzt sie ins
// Deutsche — relevant fuer ein tuerkisch-/kurdisch-/deutschsprachiges
// Publikum. translatedText ist bewusst null, wenn die Nachricht schon
// deutsch ist (kein unnoetiger "Original == Uebersetzung"-Toggle in der UI).
export async function detectAndTranslate(text: string): Promise<TranslationResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — Uebersetzung ist nicht konfiguriert.");
  }

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
            "Erkenne die Sprache des folgenden Gaestebuch-Textes und uebersetze ihn ins Deutsche. " +
            'Antworte ausschliesslich als JSON-Objekt: {"detectedLanguage": "<ISO-639-1-Code oder Sprachname, z.B. \\"tr\\", \\"ku\\", \\"de\\">", ' +
            '"translation": "<deutsche Uebersetzung, oder null falls der Text bereits deutsch ist>"}. Kein zusaetzlicher Text.',
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Uebersetzung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: { detectedLanguage?: string; translation?: string | null };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!parsed.detectedLanguage) throw new Error("OpenAI-Antwort fehlte die erkannte Sprache.");

  return { detectedLanguage: parsed.detectedLanguage, translatedText: parsed.translation ?? null };
}
