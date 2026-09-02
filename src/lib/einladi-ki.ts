const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const einladiKiConfigured = Boolean(OPENAI_API_KEY);

// Kontingent an User-Nachrichten pro Event — gleiches Schutzmuster wie
// AI_TEXT_ATTEMPT_QUOTA/AI_DESIGN_ATTEMPT_QUOTA. Grosszuegiger als die
// Bild-Kontingente, da reine Text-Antworten deutlich billiger sind.
export const EINLADI_KI_MESSAGE_QUOTA = 60;

export type EinladiKiContext = {
  title: string;
  subtitle: string | null;
  description: string | null;
  eventTypeName: string;
  eventDateLabel: string;
  locationName: string | null;
  guestCount: number;
  yesCount: number;
  noCount: number;
  unsureCount: number;
};

export type EinladiKiSuggestion = {
  field: "title" | "subtitle" | "description";
  value: string;
};

export type EinladiKiChatMessage = { role: "user" | "assistant"; content: string };

export type EinladiKiResult = { reply: string; suggestion: EinladiKiSuggestion | null };

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

function systemPrompt(context: EinladiKiContext): string {
  return (
    "Du bist \"Einladi KI\", der freundliche deutschsprachige Assistent im Dashboard der einladi-Plattform " +
    "(digitale Einladungsseiten fuer Hochzeiten und andere Feiern, Zielgruppe u.a. tuerkisch-/kurdischsprachige Hochzeitsgaeste). " +
    "Du hilfst dem Gastgeber direkt bei seinem Event: Fragen zum Stand (Gaeste, Zusagen), sowie das Schreiben/Verbessern " +
    "von Titel, Untertitel und Beschreibung der Einladungsseite. Antworte kurz, warm, konkret — kein Blabla. " +
    "Wenn der Nutzer einen neuen oder verbesserten Text fuer Titel, Untertitel oder Beschreibung will, formuliere ihn " +
    "direkt aus (nicht nur ankuendigen) und liefere ihn im suggestion-Feld, damit der Nutzer ihn per Klick uebernehmen kann. " +
    "Erfinde keine Fakten (Datum, Ort, Gaestezahlen) — nutze ausschliesslich die gegebenen Event-Daten. " +
    'Antworte AUSSCHLIESSLICH als JSON-Objekt: {"reply": "deine Chat-Antwort", "suggestion": null | {"field": "title"|"subtitle"|"description", "value": "vorgeschlagener Text"}}. ' +
    "Kein Markdown, kein Text ausserhalb des JSON.\n\n" +
    `Aktuelle Event-Daten:\n${JSON.stringify(context, null, 2)}`
  );
}

export async function askEinladiKi(context: EinladiKiContext, history: EinladiKiChatMessage[]): Promise<EinladiKiResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — Einladi KI ist nicht konfiguriert.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.4-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: systemPrompt(context) }, ...history],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Einladi KI fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Einladi KI lieferte keine Antwort.");

  let parsed: Partial<EinladiKiResult>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Einladi KI lieferte kein gueltiges JSON.");
  }
  if (!parsed.reply) throw new Error("Einladi KI lieferte keine Antwort.");

  const suggestion =
    parsed.suggestion &&
    ["title", "subtitle", "description"].includes(parsed.suggestion.field) &&
    typeof parsed.suggestion.value === "string" &&
    parsed.suggestion.value.trim()
      ? { field: parsed.suggestion.field, value: parsed.suggestion.value.trim() }
      : null;

  return { reply: parsed.reply, suggestion };
}
