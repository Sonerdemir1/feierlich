const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiGuestbookCurationConfigured = Boolean(OPENAI_API_KEY);

// Gleiches Kostendeckel-Muster wie PHOTO_CURATION_BATCH_LIMIT — Text ist
// zwar guenstiger als Bilder, ein einzelner Aufruf soll aber trotzdem nicht
// unbegrenzt viele Nachrichten auf einmal tragen.
export const GUESTBOOK_CURATION_BATCH_LIMIT = 30;

export type GuestbookVerdict = "unangemessen" | "herzlich" | "ok";

export type GuestbookCurationResult = { id: string; verdict: GuestbookVerdict; reason: string };

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

// Bewertet eine Reihe von Gaestebuch-Nachrichten in einem einzigen Aufruf,
// damit der Gastgeber bei vielen Eintraegen nicht jeden einzeln lesen muss,
// um Spam/Unangemessenes zu finden oder besonders schoene Nachrichten zu
// entdecken. Wie bei der Foto-Kuration nur ein Vorschlag — der Gastgeber
// gibt am Ende selbst frei/blendet aus/loescht, die KI entscheidet nichts
// automatisch.
export async function analyzeGuestbookMessages(
  entries: { id: string; message: string }[]
): Promise<GuestbookCurationResult[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — die Gästebuch-Kuration ist nicht konfiguriert.");
  }
  if (entries.length === 0) return [];

  const listing = entries.map((e) => `- ID ${e.id}: "${e.message.replace(/"/g, "'").slice(0, 500)}"`).join("\n");

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
            "Du bewertest Gaestebuch-Nachrichten von einer Hochzeits-/Feier-Einladungsseite, damit der " +
            "Gastgeber schneller moderieren kann. Nachrichten koennen auf Deutsch, Tuerkisch oder Kurdisch sein. " +
            'Vergib fuer jede Nachricht (identifiziert per ID) genau eines: "unangemessen" (Spam, Werbung, ' +
            "beleidigend, oder erkennbar nicht an das Brautpaar/den Gastgeber gerichtet), " +
            '"herzlich" (besonders persoenlich, ruehrend oder erwaehnenswert), oder "ok" (normale, unauffaellige ' +
            "Glueckwunsch-Nachricht). Im Zweifel fuer eine normale Glueckwunsch-Nachricht immer \"ok\" waehlen, " +
            'nicht "unangemessen". Antworte ausschliesslich als JSON-Objekt: ' +
            '{"results": [{"id": "<ID>", "verdict": "unangemessen|herzlich|ok", "reason": "<ein kurzer Satz auf Deutsch>"}, ...]}. ' +
            "Fuer jede genannte ID genau ein Ergebnis, keine zusaetzlichen.",
        },
        { role: "user", content: listing },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Gästebuchanalyse fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: { results?: GuestbookCurationResult[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!Array.isArray(parsed.results)) throw new Error("OpenAI-Antwort enthielt keine Ergebnisse.");

  return parsed.results;
}
