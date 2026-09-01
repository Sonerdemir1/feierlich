const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const aiTextConfigured = Boolean(OPENAI_API_KEY);

// Kontingent pro Event, gleiches Muster wie AI_DESIGN_ATTEMPT_QUOTA —
// schuetzt vor unkontrollierten Kosten. Text-Generierung ist deutlich
// billiger als Bildbearbeitung, daher kein Kauf-AddOn noetig, nur ein
// grosszuegigeres Limit.
export const AI_TEXT_ATTEMPT_QUOTA = 20;

export type InvitationCopyInput = {
  names: string;
  eventType: string;
  keyDetails: string;
  tone: string;
};

export type InvitationCopyResult = {
  welcomeText: string;
  description: string;
};

type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

export async function generateInvitationCopy(input: InvitationCopyInput): Promise<InvitationCopyResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt — der Text-Assistent ist nicht konfiguriert.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du schreibst warme, einladende deutsche Texte fuer digitale Event-Einladungen (Hochzeiten, Geburtstage u.ae.). " +
            'Antworte ausschliesslich als JSON-Objekt mit genau den Feldern "welcomeText" (1-2 kurze Saetze, Begruessung fuer die Startseite) ' +
            'und "description" (ein kurzer Absatz, 3-5 Saetze, Beschreibung des Events). Kein Markdown, kein zusaetzlicher Text.',
        },
        {
          role: "user",
          content: `Namen: ${input.names}\nAnlass: ${input.eventType}\nStil/Ton: ${input.tone}\nWichtige Details: ${input.keyDetails}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI-Textgenerierung fehlgeschlagen (${response.status}): ${detail.slice(0, 300)}`);
  }

  const json = (await response.json()) as OpenAiChatResponse;
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI-Antwort enthielt keinen Text.");

  let parsed: Partial<InvitationCopyResult>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI-Antwort war kein gueltiges JSON.");
  }
  if (!parsed.welcomeText || !parsed.description) {
    throw new Error("OpenAI-Antwort fehlten erwartete Felder.");
  }

  return { welcomeText: parsed.welcomeText, description: parsed.description };
}
